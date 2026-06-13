import type { createServiceRoleClient } from "@/lib/supabase/server";
import { getReplizClientForWorkspace } from "@/lib/repliz/resolve";
import { wibParts, wibToUtcIso } from "@/lib/date";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

/** Upcoming posting-slot instants (UTC ISO) within the lookahead window. */
function upcomingSlots(postingDays: number[], postingTimes: string[], lookaheadHours: number): string[] {
  const now = Date.now();
  const horizon = now + lookaheadHours * 3_600_000;
  const nowWib = wibParts(new Date(now).toISOString());
  const days = Math.ceil(lookaheadHours / 24) + 2;
  const out: string[] = [];

  for (let off = 0; off < days; off++) {
    const base = new Date(Date.UTC(nowWib.year, nowWib.month - 1, nowWib.day + off));
    const y = base.getUTCFullYear();
    const m = base.getUTCMonth() + 1;
    const d = base.getUTCDate();
    const isoWeekday = ((base.getUTCDay() + 6) % 7) + 1; // 1=Mon .. 7=Sun
    if (!postingDays.includes(isoWeekday)) continue;
    for (const t of postingTimes) {
      const [hh, mm] = String(t).split(":").map(Number);
      if (!Number.isFinite(hh)) continue;
      const iso = wibToUtcIso(y, m, d, hh, mm || 0);
      const ts = new Date(iso).getTime();
      if (ts > now && ts <= horizon) out.push(iso);
    }
  }
  return [...new Set(out)].sort();
}

/**
 * Pre-schedule the oldest drafts into the workspace's upcoming weekly posting
 * slots, pushing each to Repliz (which publishes at the slot time). Idempotent
 * per slot via auto_schedule_runs. Returns how many were scheduled.
 */
export async function planUpcomingSchedules(
  sb: ServiceClient,
  opts: { workspaceId: string; force?: boolean; lookaheadHours?: number },
): Promise<{ scheduled: number; reason?: string }> {
  const { data: settings } = await sb
    .from("workspace_settings")
    .select("auto_schedule_enabled, posting_days, posting_times")
    .eq("workspace_id", opts.workspaceId)
    .maybeSingle();

  if (!opts.force && !settings?.auto_schedule_enabled) return { scheduled: 0, reason: "disabled" };

  const days = settings?.posting_days ?? [];
  const times = settings?.posting_times ?? [];
  if (days.length === 0 || times.length === 0) return { scheduled: 0, reason: "no slots configured" };

  const slots = upcomingSlots(days, times, opts.lookaheadHours ?? 48);
  if (slots.length === 0) return { scheduled: 0, reason: "no upcoming slots" };

  const repliz = await getReplizClientForWorkspace(opts.workspaceId);
  if (!repliz) return { scheduled: 0, reason: "no Repliz credentials" };

  let scheduled = 0;
  for (const slotIso of slots) {
    // Skip already-filled slots.
    const { data: existing } = await sb
      .from("auto_schedule_runs")
      .select("id")
      .eq("workspace_id", opts.workspaceId)
      .eq("slot_at", slotIso)
      .maybeSingle();
    if (existing) continue;

    // Oldest draft whose account is connected.
    const { data: draft } = await sb
      .from("contents")
      .select("id, title, account_id, accounts(repliz_account_id, status)")
      .eq("workspace_id", opts.workspaceId)
      .eq("status", "draft")
      .order("created_at", { ascending: true })
      .limit(10);
    const pick = (draft ?? []).find((c) => {
      const a = c.accounts as unknown as { repliz_account_id: string | null; status: string } | null;
      return a?.repliz_account_id && a.status === "active";
    });
    if (!pick) break; // no more usable drafts

    const acc = pick.accounts as unknown as { repliz_account_id: string };
    const { data: segs } = await sb
      .from("content_segments")
      .select("body, position")
      .eq("content_id", pick.id)
      .order("position", { ascending: true });
    const bodies = (segs ?? []).map((s) => s.body);
    const main = bodies[0] ?? "";
    if (!main.trim()) {
      // skip empty content but mark slot consumed to avoid looping
      continue;
    }
    const replies = bodies.slice(1).map((b) => ({ description: b, type: "text" as const, medias: [] }));

    try {
      const res = await repliz.createSchedule({
        title: pick.title ?? "",
        description: main,
        topic: "lifestyle",
        type: "text",
        medias: [],
        accountId: acc.repliz_account_id,
        scheduleAt: slotIso,
        replies,
      });
      const replizScheduleId = (res as { scheduleId?: string })?.scheduleId ?? null;

      const { data: schedRow } = await sb
        .from("schedules")
        .insert({
          content_id: pick.id,
          account_id: pick.account_id,
          workspace_id: opts.workspaceId,
          scheduled_at: slotIso,
          status: "scheduled",
          repliz_schedule_id: replizScheduleId,
          pushed_at: new Date().toISOString(),
        })
        .select("id")
        .maybeSingle();

      await sb.from("contents").update({ status: "scheduled" }).eq("id", pick.id);
      await sb
        .from("auto_schedule_runs")
        .insert({ workspace_id: opts.workspaceId, slot_at: slotIso, content_id: pick.id, schedule_id: schedRow?.id ?? null });
      scheduled++;
    } catch {
      // Repliz error (e.g. rate limit) — stop this run; retry next cron tick.
      break;
    }
  }

  return { scheduled };
}
