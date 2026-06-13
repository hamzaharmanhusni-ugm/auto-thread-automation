import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyReplizWebhook } from "@/lib/repliz/webhook";
import type { ReplizWebhook } from "@/lib/repliz/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Repliz webhook receiver (replaces n8n WF3).
 * Handles three event types: `comment`, `schedule`, `chat`.
 * Runs with the service-role client (bypasses RLS) but scopes every write to the
 * workspace resolved from the account's `repliz_account_id`.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // ---- verify ----
  const ok = verifyReplizWebhook({
    rawBody,
    signatureHeader: req.headers.get("x-repliz-signature") ?? req.headers.get("x-token"),
    secretFromUrl: req.nextUrl.searchParams.get("secret"),
  });
  if (!ok) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: ReplizWebhook;
  try {
    payload = JSON.parse(rawBody) as ReplizWebhook;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventType = (["comment", "schedule", "chat"] as const).includes(payload.type as never)
    ? payload.type
    : "unknown";
  const externalId = payload?.data?.id ?? null;
  const sb = createServiceRoleClient();

  // ---- resolve workspace + account from repliz_account_id ----
  let workspaceId: string | null = null;
  let accountId: string | null = null;
  if (payload.accountId) {
    const { data: acc } = await sb
      .from("accounts")
      .select("id, workspace_id, auto_reply_mode")
      .eq("repliz_account_id", payload.accountId)
      .maybeSingle();
    if (acc) {
      workspaceId = acc.workspace_id;
      accountId = acc.id;
    }
  }

  // ---- idempotent inbound log ----
  const { data: logged, error: logErr } = await sb
    .from("webhook_events")
    .upsert(
      {
        provider: "repliz",
        event_type: eventType,
        external_id: externalId,
        account_id: accountId,
        workspace_id: workspaceId,
        signature_valid: true,
        headers: Object.fromEntries(req.headers),
        body: payload as never,
      },
      { onConflict: "provider,event_type,external_id", ignoreDuplicates: true },
    )
    .select("id, processed")
    .maybeSingle();

  if (logErr) {
    await logError(sb, workspaceId, accountId, "webhook", logErr.message, payload);
    return NextResponse.json({ error: "log failed" }, { status: 500 });
  }
  // Duplicate delivery → already handled.
  if (!logged) return NextResponse.json({ ok: true, duplicate: true });

  try {
    if (eventType === "comment") {
      await handleComment(sb, payload, workspaceId, accountId);
    } else if (eventType === "schedule") {
      await handleSchedule(sb, payload, workspaceId);
    }
    // `chat` is stored only for now.

    await sb.from("webhook_events").update({ processed: true }).eq("id", logged.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "processing error";
    await sb.from("webhook_events").update({ processing_error: msg }).eq("id", logged.id);
    await logError(sb, workspaceId, accountId, "webhook", msg, payload);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function handleComment(
  sb: ReturnType<typeof createServiceRoleClient>,
  payload: ReplizWebhook,
  workspaceId: string | null,
  accountId: string | null,
) {
  if (!accountId || !workspaceId) return; // unknown account — stored in webhook log only
  const c = payload.data.comment;
  const mediaUrls = (c?.medias ?? []).map((m) => m.url).filter(Boolean);

  await sb.from("comments").upsert(
    {
      account_id: accountId,
      workspace_id: workspaceId,
      repliz_comment_record_id: payload.data.id,
      platform_comment_id: c?.id ?? null,
      repliz_content_id: payload.data.content?.id ?? null,
      commenter_username: c?.owner?.name ?? null,
      commenter_external_id: c?.owner?.id ?? null,
      comment_text: c?.text ?? null,
      comment_media_urls: mediaUrls,
      reply_status: "pending",
      raw: payload.data as never,
    },
    { onConflict: "account_id,repliz_comment_record_id", ignoreDuplicates: true },
  );

  // Auto-reply mode handling is enqueued by the worker (queue) — see docs/API.md.
  // For full_auto, enqueue a comment_reply job here once the worker is deployed.
}

async function handleSchedule(
  sb: ReturnType<typeof createServiceRoleClient>,
  payload: ReplizWebhook,
  workspaceId: string | null,
) {
  const scheduleId = payload.data.id;
  if (!scheduleId) return;

  const replizContentId = payload.data.content?.id ?? null;
  const { data: sched } = await sb
    .from("schedules")
    .update({
      status: "posted",
      posted_at: new Date().toISOString(),
      ...(replizContentId ? { repliz_content_id: replizContentId } : {}),
    })
    .eq("repliz_schedule_id", scheduleId)
    .select("content_id")
    .maybeSingle();

  if (sched?.content_id) {
    await sb.from("contents").update({ status: "posted" }).eq("id", sched.content_id);
  }
  void workspaceId;
}

async function logError(
  sb: ReturnType<typeof createServiceRoleClient>,
  workspaceId: string | null,
  accountId: string | null,
  source: string,
  message: string,
  context: unknown,
) {
  await sb.from("error_logs").insert({
    workspace_id: workspaceId,
    account_id: accountId,
    source,
    message,
    context: context as never,
  });
}

/** Health probe for webhook registration testing. */
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "repliz-webhook" });
}
