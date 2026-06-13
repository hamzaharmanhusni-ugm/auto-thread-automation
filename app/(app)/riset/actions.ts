"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateIdeas } from "@/lib/ai/research";
import { generateContent } from "@/lib/ai/content";
import { getAiClientForWorkspace } from "@/lib/ai/resolve";

/** #5 Riset Ide — generate fresh ideas for an account's default persona. */
export async function generateIdeasAction(
  accountId: string,
  count: number,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const sb = await createClient();

  const { data: persona } = await sb
    .from("personas")
    .select("id, name, description, tone, audience, niche, cta")
    .eq("account_id", accountId)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!persona) return { ok: false, error: "Akun ini belum punya persona." };

  const { data: recent } = await sb
    .from("contents")
    .select("title")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(20);
  const recentTitles = (recent ?? []).map((r) => r.title).filter(Boolean) as string[];

  const { data: acc } = await sb.from("accounts").select("workspace_id").eq("id", accountId).maybeSingle();
  if (!acc) return { ok: false, error: "Akun tidak ditemukan." };

  try {
    const ai = await getAiClientForWorkspace(acc.workspace_id);
    const ideas = await generateIdeas({
      persona,
      recentTitles,
      count: Math.min(10, Math.max(1, count)),
      client: ai,
    });
    if (ideas.length === 0) return { ok: false, error: "AI tidak menghasilkan ide. Coba lagi." };

    const rows = ideas.map((i) => ({
      account_id: accountId,
      persona_id: persona.id,
      workspace_id: acc.workspace_id,
      title: i.title,
      angle: i.angle,
      hook: i.hook,
      status: "draft" as const,
      ai_provider: "gemini" as const,
    }));
    const { error } = await sb.from("content_ideas").insert(rows);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/riset");
    revalidatePath("/dashboard");
    return { ok: true, count: rows.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menghasilkan ide." };
  }
}

export async function setIdeaStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<{ ok: boolean; error?: string }> {
  const sb = await createClient();
  const { error } = await sb.from("content_ideas").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/riset");
  return { ok: true };
}

/** #6 Generate Konten — turn an idea into a ready draft (+ thread segments). */
export async function createContentFromIdea(
  ideaId: string,
  postType: "single" | "thread",
): Promise<{ ok: boolean; contentId?: string; error?: string }> {
  const sb = await createClient();

  const { data: idea } = await sb
    .from("content_ideas")
    .select("id, title, angle, hook, account_id, persona_id, workspace_id")
    .eq("id", ideaId)
    .maybeSingle();
  if (!idea) return { ok: false, error: "Ide tidak ditemukan." };

  const { data: persona } = idea.persona_id
    ? await sb
        .from("personas")
        .select("name, description, tone, audience, niche, cta")
        .eq("id", idea.persona_id)
        .maybeSingle()
    : { data: null };

  try {
    const ai = await getAiClientForWorkspace(idea.workspace_id);
    const gen = await generateContent({
      idea,
      persona: persona ?? { name: "Threads Creator" },
      postType,
      client: ai,
    });

    const { data: content, error: ce } = await sb
      .from("contents")
      .insert({
        account_id: idea.account_id,
        idea_id: idea.id,
        persona_id: idea.persona_id,
        workspace_id: idea.workspace_id,
        title: gen.title,
        body: gen.segments[0],
        post_type: gen.post_type,
        status: "draft",
        viral_score: gen.viral_score,
        suggested_comments: gen.suggested_comments.length ? gen.suggested_comments : null,
        ai_provider: "gemini",
      })
      .select("id")
      .maybeSingle();
    if (ce || !content) return { ok: false, error: ce?.message ?? "Gagal menyimpan konten." };

    const segRows = gen.segments.map((body, i) => ({
      content_id: content.id,
      workspace_id: idea.workspace_id,
      position: i,
      body,
    }));
    await sb.from("content_segments").insert(segRows);
    await sb.from("content_ideas").update({ status: "used" }).eq("id", idea.id);

    revalidatePath("/riset");
    revalidatePath("/konten");
    revalidatePath("/kalender");
    return { ok: true, contentId: content.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal membuat konten." };
  }
}
