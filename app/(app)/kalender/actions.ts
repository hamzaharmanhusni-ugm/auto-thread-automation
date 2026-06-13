"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getReplizClientForWorkspace } from "@/lib/repliz/resolve";

type Result = { ok: boolean; error?: string };

/** Schedule a draft content at a given UTC instant (status=pending → worker pushes it). */
export async function scheduleContent(contentId: string, scheduledAtUtc: string): Promise<Result> {
  const sb = await createClient();
  const { data: content, error: ce } = await sb
    .from("contents")
    .select("account_id, workspace_id")
    .eq("id", contentId)
    .maybeSingle();
  if (ce || !content) return { ok: false, error: "Konten tidak ditemukan." };

  const { error } = await sb.from("schedules").insert({
    content_id: contentId,
    account_id: content.account_id,
    workspace_id: content.workspace_id, // re-derived by trigger; required by type
    scheduled_at: scheduledAtUtc,
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };

  await sb.from("contents").update({ status: "scheduled" }).eq("id", contentId);
  revalidatePath("/kalender");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Move an existing (not-yet-posted) schedule to a new UTC instant. */
export async function rescheduleSchedule(scheduleId: string, scheduledAtUtc: string): Promise<Result> {
  const sb = await createClient();
  const { error } = await sb
    .from("schedules")
    .update({ scheduled_at: scheduledAtUtc })
    .eq("id", scheduleId)
    .in("status", ["pending", "scheduled"]);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/kalender");
  return { ok: true };
}

/** Cancel a schedule; if it was already pushed to Repliz, delete it there too. */
export async function cancelSchedule(scheduleId: string): Promise<Result> {
  const sb = await createClient();
  const { data: s } = await sb
    .from("schedules")
    .select("content_id, repliz_schedule_id")
    .eq("id", scheduleId)
    .maybeSingle();

  if (s?.repliz_schedule_id) {
    try {
      const ws = await getCurrentWorkspaceId();
      const repliz = await getReplizClientForWorkspace(ws);
      await repliz?.deleteSchedule(s.repliz_schedule_id);
    } catch {
      // best-effort; local cancel still proceeds
    }
  }

  const { error } = await sb.from("schedules").update({ status: "cancelled" }).eq("id", scheduleId);
  if (error) return { ok: false, error: error.message };
  if (s?.content_id) await sb.from("contents").update({ status: "draft" }).eq("id", s.content_id);

  revalidatePath("/kalender");
  revalidatePath("/dashboard");
  return { ok: true };
}
