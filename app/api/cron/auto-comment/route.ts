import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getReplizClientForWorkspace } from "@/lib/repliz/resolve";
import { getAiClientForWorkspace } from "@/lib/ai/resolve";
import { generateEngagementComment } from "@/lib/ai/comment";
import { getDefaultWorkspaceId } from "@/lib/mcp/workspace";
import type { ReplizClient } from "@/lib/repliz/client";
import type { AiClient } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FALLBACKS = ["Keren banget ini 🔥", "Setuju sih", "Makasih insight-nya!", "Bermanfaat banget", "Mantap!"];
const BATCH = 25;

/**
 * Cron runner: posts due inter-account comments to Repliz with their natural
 * staggered timing. Called by Vercel Cron (or pg_cron) every minute.
 * Auth: `Authorization: Bearer <CRON_SECRET>` (Vercel cron) or `?key=<CRON_SECRET>`.
 */
/** Effective cron secret: env first, else the default workspace's UI-set value. */
async function resolveCronSecret(sb: ReturnType<typeof createServiceRoleClient>): Promise<string | null> {
  if (process.env.CRON_SECRET) return process.env.CRON_SECRET;
  try {
    const ws = await getDefaultWorkspaceId();
    const { data } = await sb.from("workspace_settings").select("cron_secret").eq("workspace_id", ws).maybeSingle();
    return data?.cron_secret || null;
  } catch {
    return null;
  }
}

async function run(req: NextRequest) {
  const sb = createServiceRoleClient();
  const secret = await resolveCronSecret(sb);
  if (!secret) {
    return NextResponse.json(
      { error: "Cron belum aktif. Set CRON_SECRET (env) atau buat token di Pengaturan." },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.replace(/^Bearer\s+/i, "") || req.nextUrl.searchParams.get("key") || "";
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const { data: jobs } = await sb
    .from("auto_comment_jobs")
    .select(
      "id, workspace_id, content_id, commenter_account_id, repliz_content_id, repliz_account_id, comment_text, attempts",
    )
    .eq("status", "pending")
    .lte("run_at", nowIso)
    .order("run_at", { ascending: true })
    .limit(BATCH);

  if (!jobs || jobs.length === 0) return NextResponse.json({ ok: true, processed: 0, posted: 0 });

  const replizByWs = new Map<string, ReplizClient | null>();
  const aiByWs = new Map<string, AiClient | null>();
  let posted = 0;
  let failed = 0;

  for (const job of jobs) {
    let repliz = replizByWs.get(job.workspace_id);
    if (repliz === undefined) {
      repliz = await getReplizClientForWorkspace(job.workspace_id);
      replizByWs.set(job.workspace_id, repliz);
    }
    if (!repliz) {
      await sb
        .from("auto_comment_jobs")
        .update({ status: "failed", last_error: "Kredensial Repliz tidak ada", attempts: job.attempts + 1 })
        .eq("id", job.id);
      failed++;
      continue;
    }

    // Resolve comment text: stored, else AI per commenter persona, else fallback.
    let text = job.comment_text ?? undefined;
    if (!text && job.content_id) {
      let ai = aiByWs.get(job.workspace_id);
      if (ai === undefined) {
        try {
          ai = await getAiClientForWorkspace(job.workspace_id);
        } catch {
          ai = null;
        }
        aiByWs.set(job.workspace_id, ai);
      }
      if (ai) {
        try {
          const { data: content } = await sb.from("contents").select("body").eq("id", job.content_id).maybeSingle();
          const { data: persona } = await sb
            .from("personas")
            .select("name, tone, audience, niche")
            .eq("account_id", job.commenter_account_id)
            .order("is_default", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (content?.body) text = await generateEngagementComment({ postBody: content.body, persona, client: ai });
        } catch {
          text = undefined;
        }
      }
    }
    if (!text) text = FALLBACKS[posted % FALLBACKS.length];

    try {
      await repliz.commentOnContent(job.repliz_content_id, text, job.repliz_account_id);
      await sb.from("auto_comment_jobs").update({ status: "done", comment_text: text }).eq("id", job.id);
      posted++;
    } catch (e) {
      const attempts = job.attempts + 1;
      await sb
        .from("auto_comment_jobs")
        .update({
          status: attempts >= 3 ? "failed" : "pending",
          attempts,
          last_error: e instanceof Error ? e.message : "gagal",
        })
        .eq("id", job.id);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, processed: jobs.length, posted, failed });
}

export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}
