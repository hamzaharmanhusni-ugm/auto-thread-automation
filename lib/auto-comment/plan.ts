import type { createServiceRoleClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (Math.max(min, max) - min + 1));

/**
 * Plan inter-account comments for a posted content with natural, staggered random
 * delays (e.g. commenter 1 at +2min, commenter 2 at +6min, ...). Idempotent per
 * content unless `force` is set. The cron runner posts them when due.
 */
export async function planAutoComments(
  sb: ServiceClient,
  opts: {
    contentId: string;
    workspaceId: string;
    force?: boolean;
    count?: number;
    minMinutes?: number;
    maxMinutes?: number;
  },
): Promise<{ planned: number; reason?: string }> {
  const { data: settings } = await sb
    .from("workspace_settings")
    .select("auto_comment_enabled, auto_comment_count, auto_comment_min_minutes, auto_comment_max_minutes")
    .eq("workspace_id", opts.workspaceId)
    .maybeSingle();

  if (!opts.force && !settings?.auto_comment_enabled) return { planned: 0, reason: "disabled" };

  const count = opts.count ?? settings?.auto_comment_count ?? 0;
  if (count < 1) return { planned: 0, reason: "count 0" };

  const minM = Math.max(0, opts.minMinutes ?? settings?.auto_comment_min_minutes ?? 2);
  const maxM = Math.max(minM, opts.maxMinutes ?? settings?.auto_comment_max_minutes ?? 8);

  const { data: content } = await sb
    .from("contents")
    .select("account_id, suggested_comments, status")
    .eq("id", opts.contentId)
    .maybeSingle();
  if (!content) return { planned: 0, reason: "content not found" };
  if (content.status !== "posted") return { planned: 0, reason: "not posted" };

  const { data: sched } = await sb
    .from("schedules")
    .select("repliz_content_id")
    .eq("content_id", opts.contentId)
    .not("repliz_content_id", "is", null)
    .order("posted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sched?.repliz_content_id) return { planned: 0, reason: "no repliz content id" };

  // Idempotency: skip if already planned for this content (unless forced).
  if (!opts.force) {
    const { count: existing } = await sb
      .from("auto_comment_jobs")
      .select("id", { count: "exact", head: true })
      .eq("content_id", opts.contentId);
    if ((existing ?? 0) > 0) return { planned: 0, reason: "already planned" };
  }

  const { data: others } = await sb
    .from("accounts")
    .select("id, repliz_account_id")
    .eq("workspace_id", opts.workspaceId)
    .neq("id", content.account_id)
    .eq("status", "active")
    .not("repliz_account_id", "is", null)
    .limit(count);
  if (!others || others.length === 0) return { planned: 0, reason: "no other accounts" };

  const suggested = (content.suggested_comments ?? []).filter(Boolean);
  const base = Date.now();
  let cumulativeMin = 0;

  const rows = others.map((acc, i) => {
    cumulativeMin += randInt(minM, maxM); // staggered: each later than the previous
    return {
      workspace_id: opts.workspaceId,
      content_id: opts.contentId,
      commenter_account_id: acc.id,
      repliz_content_id: sched.repliz_content_id!,
      repliz_account_id: acc.repliz_account_id!,
      comment_text: suggested[i] ?? null,
      run_at: new Date(base + cumulativeMin * 60_000).toISOString(),
      status: "pending",
    };
  });

  const { error } = await sb.from("auto_comment_jobs").insert(rows);
  if (error) return { planned: 0, reason: error.message };
  return { planned: rows.length };
}
