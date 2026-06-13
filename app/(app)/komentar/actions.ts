"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getReplizClientForWorkspace } from "@/lib/repliz/resolve";
import { getAiClientForWorkspace } from "@/lib/ai/resolve";
import { generateCommentReply } from "@/lib/ai/comment";
import type { Enums } from "@/lib/database.types";

type Result = { ok: boolean; error?: string; reply?: string };

/** Draft an AI reply for an incoming comment (saved, awaiting send/approval). */
export async function generateReply(commentId: string): Promise<Result> {
  const sb = await createClient();
  const { data: c } = await sb
    .from("comments")
    .select("comment_text, content_id, account_id, workspace_id")
    .eq("id", commentId)
    .maybeSingle();
  if (!c) return { ok: false, error: "Komentar tidak ditemukan." };

  const [{ data: content }, { data: persona }] = await Promise.all([
    c.content_id
      ? sb.from("contents").select("body").eq("id", c.content_id).maybeSingle()
      : Promise.resolve({ data: null }),
    sb
      .from("personas")
      .select("name, tone, audience, niche, cta")
      .eq("account_id", c.account_id)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  try {
    const ai = await getAiClientForWorkspace(c.workspace_id);
    const reply = await generateCommentReply({
      comment: c.comment_text ?? "",
      persona: persona ?? null,
      postContext: content?.body ?? null,
      client: ai,
    });
    const { error } = await sb
      .from("comments")
      .update({ ai_reply: reply, ai_provider: "gemini", reply_status: "approved" })
      .eq("id", commentId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/komentar");
    return { ok: true, reply };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal membuat balasan AI." };
  }
}

/** Send a reply to Repliz and mark the comment replied. */
export async function sendReply(commentId: string, text: string): Promise<Result> {
  if (!text.trim()) return { ok: false, error: "Balasan kosong." };
  const sb = await createClient();
  const { data: c } = await sb
    .from("comments")
    .select("repliz_comment_record_id, workspace_id")
    .eq("id", commentId)
    .maybeSingle();
  if (!c?.repliz_comment_record_id) return { ok: false, error: "Komentar tidak valid." };

  const ws = await getCurrentWorkspaceId();
  const repliz = await getReplizClientForWorkspace(ws);
  if (!repliz) return { ok: false, error: "Kredensial Repliz belum diatur." };

  try {
    await repliz.replyComment(c.repliz_comment_record_id, text.trim());
    await sb
      .from("comments")
      .update({ ai_reply: text.trim(), reply_status: "replied", replied_at: new Date().toISOString() })
      .eq("id", commentId);
    revalidatePath("/komentar");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    await sb.from("comments").update({ reply_status: "failed" }).eq("id", commentId);
    return { ok: false, error: e instanceof Error ? e.message : "Gagal mengirim balasan." };
  }
}

export async function skipReply(commentId: string): Promise<Result> {
  const sb = await createClient();
  const { error } = await sb.from("comments").update({ reply_status: "skipped" }).eq("id", commentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/komentar");
  return { ok: true };
}

/** Set an account's auto-reply mode (manual / semi_auto / full_auto). */
export async function setAccountReplyMode(
  accountId: string,
  mode: Enums<"auto_reply_mode_t">,
): Promise<Result> {
  const sb = await createClient();
  const { error } = await sb.from("accounts").update({ auto_reply_mode: mode }).eq("id", accountId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/komentar");
  revalidatePath("/akun");
  return { ok: true };
}
