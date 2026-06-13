import { getAiClient, type AiProvider, type AiClient } from "./provider";
import type { PersonaInput } from "./research";

/**
 * Generate a natural, on-persona reply to an incoming Threads comment
 * (the AI auto-comment-reply feature).
 */
export async function generateCommentReply(input: {
  comment: string;
  persona?: PersonaInput | null;
  postContext?: string | null;
  provider?: AiProvider;
  client?: AiClient;
}): Promise<string> {
  const ai = input.client ?? getAiClient(input.provider);
  const p = input.persona;

  const system = [
    "Kamu membalas komentar di Threads sebagai pemilik akun, berbahasa Indonesia.",
    "Balasan singkat (1-2 kalimat), hangat, natural, dan relevan dengan komentarnya.",
    "Jangan kaku, jangan terdengar seperti bot, maksimal 1 emoji bila perlu.",
    p ? `Persona: ${p.name}${p.tone ? `, nada ${p.tone}` : ""}${p.audience ? `, audiens ${p.audience}` : ""}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const prompt = [
    input.postContext ? `Konteks postingan: ${input.postContext}` : "",
    `Komentar masuk: "${input.comment}"`,
    "Tulis SATU balasan saja (tanpa tanda kutip, tanpa penjelasan tambahan).",
  ]
    .filter(Boolean)
    .join("\n");

  const text = await ai.generateText({ system, prompt, temperature: 0.85 });
  return text.trim().replace(/^["']|["']$/g, "");
}
