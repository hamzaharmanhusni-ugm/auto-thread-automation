"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getReplizClientForWorkspace } from "@/lib/repliz/resolve";
import { getAiClientForWorkspace } from "@/lib/ai/resolve";
import { generateContent } from "@/lib/ai/content";

type Result = { ok: boolean; error?: string };

/** Ask AI to draft a post body for an account from a short topic (manual compose helper). */
export async function generateBodyForAccount(
  accountId: string,
  topic: string,
  postType: "single" | "thread",
): Promise<{ ok: boolean; title?: string; segments?: string[]; error?: string }> {
  if (!topic.trim()) return { ok: false, error: "Tulis dulu topik atau ide singkatnya." };
  const sb = await createClient();
  const { data: acc } = await sb.from("accounts").select("workspace_id").eq("id", accountId).maybeSingle();
  if (!acc) return { ok: false, error: "Akun tidak ditemukan." };

  const { data: persona } = await sb
    .from("personas")
    .select("name, description, tone, audience, niche, cta")
    .eq("account_id", accountId)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    const ai = await getAiClientForWorkspace(acc.workspace_id);
    const gen = await generateContent({
      idea: { title: topic.trim() },
      persona: persona ?? { name: "Threads Creator" },
      postType,
      client: ai,
    });
    return { ok: true, title: gen.title, segments: gen.segments };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal generate." };
  }
}

/** Create a content manually (written or AI-assisted), optionally scheduled at a UTC instant. */
export async function createManualContent(input: {
  accountId: string;
  title: string;
  segments: string[];
  postType: "single" | "thread";
  scheduleAtUtc?: string | null;
  aiAssisted?: boolean;
}): Promise<{ ok: boolean; contentId?: string; error?: string }> {
  if (!input.accountId) return { ok: false, error: "Pilih akun dulu." };
  const sb = await createClient();
  const { data: acc } = await sb.from("accounts").select("workspace_id").eq("id", input.accountId).maybeSingle();
  if (!acc) return { ok: false, error: "Akun tidak ditemukan." };

  const segs =
    input.postType === "single"
      ? [input.segments.join("\n\n").trim()]
      : input.segments.map((s) => s.trim()).filter(Boolean);
  if (!segs.length || !segs[0]) return { ok: false, error: "Isi konten tidak boleh kosong." };

  const { data: persona } = await sb
    .from("personas")
    .select("id")
    .eq("account_id", input.accountId)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: content, error } = await sb
    .from("contents")
    .insert({
      account_id: input.accountId,
      persona_id: persona?.id ?? null,
      workspace_id: acc.workspace_id,
      title: input.title.trim() || segs[0].slice(0, 80),
      body: segs[0],
      post_type: input.postType,
      status: input.scheduleAtUtc ? "scheduled" : "draft",
      ai_provider: input.aiAssisted ? "gemini" : null,
    })
    .select("id")
    .maybeSingle();
  if (error || !content) return { ok: false, error: error?.message ?? "Gagal menyimpan konten." };

  await sb
    .from("content_segments")
    .insert(segs.map((body, i) => ({ content_id: content.id, workspace_id: acc.workspace_id, position: i, body })));

  if (input.scheduleAtUtc) {
    await sb.from("schedules").insert({
      content_id: content.id,
      account_id: input.accountId,
      workspace_id: acc.workspace_id,
      scheduled_at: input.scheduleAtUtc,
      status: "pending",
    });
  }

  revalidatePath("/kalender");
  revalidatePath("/konten");
  revalidatePath("/dashboard");
  return { ok: true, contentId: content.id };
}

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
