// ThreadsGrowth AI — queue worker (Supabase Edge Function, Deno).
//
// Drains `ai_jobs` (status='queued') and executes them. Currently implements
// `schedule_push` (push due schedules to Repliz). AI jobs (comment_reply,
// idea_research, embedding) are gated on GEMINI_API_KEY and skipped if absent.
//
// Auth: Bearer <WORKER_SECRET>. Invoke manually or via pg_cron + pg_net.
// Auto-injected secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Set manually: WORKER_SECRET, REPLIZ_USERNAME, REPLIZ_PASSWORD, REPLIZ_BASE_URL?
//   supabase secrets set WORKER_SECRET=... REPLIZ_USERNAME=... REPLIZ_PASSWORD=...

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const REPLIZ_BASE = Deno.env.get("REPLIZ_BASE_URL") ?? "https://api.repliz.com";
const BATCH = 10;

Deno.serve(async (req) => {
  const secret = Deno.env.get("WORKER_SECRET");
  const provided = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret || provided !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: jobs } = await supabase
    .from("ai_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(BATCH);

  const results: unknown[] = [];

  for (const job of jobs ?? []) {
    // Atomically claim the job (skip if another worker took it).
    const { data: claimed } = await supabase
      .from("ai_jobs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", job.id)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    try {
      let result: unknown;
      switch (job.job_type) {
        case "schedule_push":
          result = await handleSchedulePush(supabase, job);
          break;
        default:
          result = { skipped: true, reason: `job_type '${job.job_type}' belum diimplementasikan` };
      }
      await supabase
        .from("ai_jobs")
        .update({ status: "succeeded", result, finished_at: new Date().toISOString() })
        .eq("id", job.id);
      results.push({ id: job.id, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const attempts = (job.attempts ?? 0) + 1;
      const dead = attempts >= (job.max_attempts ?? 3);
      await supabase
        .from("ai_jobs")
        .update({
          status: dead ? "dead" : "queued",
          attempts,
          error: message,
          finished_at: dead ? new Date().toISOString() : null,
        })
        .eq("id", job.id);
      await supabase.from("error_logs").insert({
        workspace_id: job.workspace_id,
        account_id: job.account_id,
        source: "queue",
        message,
        related_job_id: job.id,
      });
      results.push({ id: job.id, ok: false, error: message });
    }
  }

  return Response.json({ processed: results.length, results });
});

async function handleSchedulePush(supabase: SupabaseClient, job: Record<string, unknown>) {
  const scheduleId = (job.payload as { schedule_id?: string })?.schedule_id;
  if (!scheduleId) throw new Error("payload.schedule_id missing");

  const { data: sched } = await supabase
    .from("schedules")
    .select("id, content_id, workspace_id, scheduled_at, topic, contents(title, body), accounts(repliz_account_id)")
    .eq("id", scheduleId)
    .maybeSingle();
  if (!sched) throw new Error("schedule not found");

  const { data: segs } = await supabase
    .from("content_segments")
    .select("position, body")
    .eq("content_id", sched.content_id)
    .order("position", { ascending: true });

  const content = sched.contents as unknown as { title: string | null; body: string };
  const account = sched.accounts as unknown as { repliz_account_id: string };

  const main = segs?.[0]?.body ?? content.body;
  const replies = (segs ?? [])
    .slice(1)
    .map((s: { body: string }) => ({ description: s.body, type: "text", medias: [] }));

  const creds = await resolveCreds(supabase, sched.workspace_id as string);
  if (!creds.username || !creds.password) throw new Error("Repliz credentials not configured");

  const payload = {
    title: content.title ?? "",
    description: main,
    topic: (sched.topic as string) ?? "lifestyle",
    type: "text",
    medias: [],
    meta: { title: "", description: "", url: "" },
    additionalInfo: {
      isAiGenerated: true,
      isDraft: false,
      collaborators: [],
      music: null,
      products: [],
      tags: [],
      mentions: [],
    },
    replies,
    accountId: account.repliz_account_id,
    scheduleAt: sched.scheduled_at,
  };

  const auth = "Basic " + btoa(`${creds.username}:${creds.password}`);
  const res = await fetch(`${REPLIZ_BASE}/public/schedule`, {
    method: "POST",
    headers: { Authorization: auth, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Repliz POST /public/schedule ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { scheduleId?: string };

  await supabase
    .from("schedules")
    .update({
      repliz_schedule_id: json.scheduleId ?? null,
      status: "scheduled",
      pushed_at: new Date().toISOString(),
    })
    .eq("id", scheduleId);
  await supabase.from("contents").update({ status: "scheduled" }).eq("id", sched.content_id);

  return { scheduleId: json.scheduleId };
}

async function resolveCreds(supabase: SupabaseClient, workspaceId: string) {
  const { data } = await supabase
    .from("repliz_credentials")
    .select("username_enc, password_enc")
    .eq("workspace_id", workspaceId)
    .eq("is_default", true)
    .maybeSingle();
  if (data?.username_enc && data?.password_enc) {
    return { username: data.username_enc as string, password: data.password_enc as string };
  }
  return {
    username: Deno.env.get("REPLIZ_USERNAME") ?? "",
    password: Deno.env.get("REPLIZ_PASSWORD") ?? "",
  };
}
