"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getReplizClientForWorkspace } from "@/lib/repliz/resolve";
import { getAiClientForWorkspace } from "@/lib/ai/resolve";
import { generateEngagementComment } from "@/lib/ai/comment";
import { planAutoComments } from "@/lib/auto-comment/plan";

type Result = { ok: boolean; error?: string };

const PLAN_REASON: Record<string, string> = {
  "not posted": "Konten harus sudah tayang dulu.",
  "no repliz content id": "Konten ini belum punya ID Repliz.",
  "no other accounts": "Tidak ada akun lain yang terhubung.",
  "count 0": "Atur jumlah akun lebih dari 0.",
  "content not found": "Konten tidak ditemukan.",
};

/** Schedule inter-account comments with natural staggered random delays (manual trigger). */
export async function scheduleInterAccountComments(
  contentId: string,
  count: number,
): Promise<{ ok: boolean; planned?: number; error?: string }> {
  const ws = await getCurrentWorkspaceId();
  const sb = createServiceRoleClient();
  const res = await planAutoComments(sb, { contentId, workspaceId: ws, force: true, count });
  if (res.planned > 0) {
    revalidatePath("/konten");
    return { ok: true, planned: res.planned };
  }
  return { ok: false, error: res.reason ? (PLAN_REASON[res.reason] ?? res.reason) : "Gagal menjadwalkan komentar." };
}

/**
 * Inter-account auto-comment ("komentar antar akun"): make `count` OTHER
 * connected Repliz accounts leave a short comment on a posted content, for
 * engagement. Comments come from the content's suggested_comments first, then
 * AI (per commenter's persona), then a friendly fallback.
 */
export async function seedInterAccountComments(
  contentId: string,
  count: number,
): Promise<{ ok: boolean; posted?: number; attempted?: number; error?: string }> {
  const sb = await createClient();
  const ws = await getCurrentWorkspaceId();

  const { data: content } = await sb
    .from("contents")
    .select("id, body, account_id, status, suggested_comments")
    .eq("id", contentId)
    .maybeSingle();
  if (!content) return { ok: false, error: "Konten tidak ditemukan." };
  if (content.status !== "posted") {
    return { ok: false, error: "Konten harus sudah tayang dulu sebelum bisa dikomentari antar akun." };
  }

  const { data: sched } = await sb
    .from("schedules")
    .select("repliz_content_id")
    .eq("content_id", contentId)
    .not("repliz_content_id", "is", null)
    .order("posted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sched?.repliz_content_id) {
    return { ok: false, error: "Konten ini belum punya ID Repliz, jadi belum bisa dikomentari." };
  }

  const want = Math.min(20, Math.max(1, Math.round(count || 1)));
  const { data: others } = await sb
    .from("accounts")
    .select("id, username, repliz_account_id, status")
    .eq("workspace_id", ws)
    .neq("id", content.account_id)
    .eq("status", "active")
    .not("repliz_account_id", "is", null)
    .limit(want);
  if (!others || others.length === 0) {
    return { ok: false, error: "Tidak ada akun lain yang terhubung untuk berkomentar." };
  }

  const repliz = await getReplizClientForWorkspace(ws);
  if (!repliz) return { ok: false, error: "Kredensial Repliz belum diatur." };

  const suggested = (content.suggested_comments ?? []).filter(Boolean);
  let ai: Awaited<ReturnType<typeof getAiClientForWorkspace>> | null = null;
  try {
    ai = await getAiClientForWorkspace(ws);
  } catch {
    ai = null;
  }
  const FALLBACKS = ["Keren banget ini 🔥", "Setuju sih sama poin ini", "Makasih insight-nya!", "Bermanfaat banget", "Mantap, lanjutkan!"];

  let posted = 0;
  for (let i = 0; i < others.length; i++) {
    const acc = others[i];
    let text: string | undefined = suggested[i];
    if (!text && ai) {
      try {
        const { data: persona } = await sb
          .from("personas")
          .select("name, tone, audience, niche")
          .eq("account_id", acc.id)
          .order("is_default", { ascending: false })
          .limit(1)
          .maybeSingle();
        text = await generateEngagementComment({ postBody: content.body, persona, client: ai });
      } catch {
        text = undefined;
      }
    }
    if (!text) text = FALLBACKS[i % FALLBACKS.length];

    try {
      await repliz.commentOnContent(sched.repliz_content_id, text, acc.repliz_account_id!);
      posted++;
    } catch {
      // skip this account, keep going
    }
  }

  if (posted === 0) {
    return { ok: false, error: "Gagal mengirim komentar. Cek koneksi Repliz atau batas posting." };
  }
  revalidatePath("/konten");
  revalidatePath("/analitik");
  return { ok: true, posted, attempted: others.length };
}

/**
 * Delete a content permanently. Cancels any active schedule first (incl. on
 * Repliz), nulls out related comments, then removes segments + the content row.
 */
export async function deleteContent(contentId: string): Promise<Result> {
  const sb = await createClient();

  const { data: content } = await sb
    .from("contents")
    .select("id, workspace_id")
    .eq("id", contentId)
    .maybeSingle();
  if (!content) return { ok: false, error: "Konten tidak ditemukan." };

  // Cancel schedules on Repliz (best-effort) before removing local rows.
  const { data: schedules } = await sb
    .from("schedules")
    .select("id, repliz_schedule_id")
    .eq("content_id", contentId);
  if (schedules && schedules.length) {
    const pushed = schedules.filter((s) => s.repliz_schedule_id);
    if (pushed.length) {
      try {
        const ws = await getCurrentWorkspaceId();
        const repliz = await getReplizClientForWorkspace(ws);
        if (repliz) {
          await Promise.allSettled(pushed.map((s) => repliz.deleteSchedule(s.repliz_schedule_id!)));
        }
      } catch {
        // best-effort; local delete still proceeds
      }
    }
  }

  await sb.from("comments").update({ content_id: null }).eq("content_id", contentId);
  await sb.from("schedules").delete().eq("content_id", contentId);
  await sb.from("content_segments").delete().eq("content_id", contentId);

  const { error } = await sb.from("contents").delete().eq("id", contentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/konten");
  revalidatePath("/kalender");
  revalidatePath("/analitik");
  revalidatePath("/dashboard");
  return { ok: true };
}

export type ContentStats = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};

function pickNum(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
}

/** Fetch live engagement stats for a posted content from Repliz. */
export async function fetchContentStats(
  contentId: string,
): Promise<{ ok: boolean; stats?: ContentStats; error?: string }> {
  const sb = await createClient();
  const { data: content } = await sb
    .from("contents")
    .select("account_id, status")
    .eq("id", contentId)
    .maybeSingle();
  if (!content) return { ok: false, error: "Konten tidak ditemukan." };
  if (content.status !== "posted") return { ok: false, error: "Statistik hanya untuk konten yang sudah tayang." };

  const { data: sched } = await sb
    .from("schedules")
    .select("repliz_content_id")
    .eq("content_id", contentId)
    .not("repliz_content_id", "is", null)
    .order("posted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: acc } = await sb
    .from("accounts")
    .select("repliz_account_id")
    .eq("id", content.account_id)
    .maybeSingle();

  if (!sched?.repliz_content_id || !acc?.repliz_account_id) {
    return { ok: false, error: "Statistik belum tersedia untuk konten ini." };
  }

  const ws = await getCurrentWorkspaceId();
  const repliz = await getReplizClientForWorkspace(ws);
  if (!repliz) return { ok: false, error: "Kredensial Repliz belum diatur." };

  try {
    const raw = await repliz.getContentStatistic(sched.repliz_content_id, acc.repliz_account_id);
    const obj = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>;
    const data = (obj.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>) : obj) as Record<
      string,
      unknown
    >;
    const stats: ContentStats = {
      views: pickNum(data, ["views", "viewsCount", "impressions", "impressionsCount", "reach"]),
      likes: pickNum(data, ["likes", "likeCount", "likesCount", "favorites"]),
      comments: pickNum(data, ["comments", "commentCount", "commentsCount", "replies"]),
      shares: pickNum(data, ["shares", "shareCount", "sharesCount", "reposts", "repostCount"]),
    };
    return { ok: true, stats };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal mengambil statistik." };
  }
}
