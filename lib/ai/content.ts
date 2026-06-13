import { getAiClient, type AiProvider, type AiClient } from "./provider";
import { parseJsonLoose, type PersonaInput } from "./research";

export type GeneratedContent = {
  title: string;
  post_type: "single" | "thread";
  segments: string[]; // 1 = single; >1 = thread (post utama + balasan)
  viral_score: number; // 1-10
  suggested_comments: string[]; // 0-3 komentar pemicu
};

/**
 * Generate a ready-to-post Threads content from an idea + persona
 * (replaces n8n WF "Content Generation").
 */
export async function generateContent(input: {
  idea: { title: string; angle?: string | null; hook?: string | null };
  persona: PersonaInput;
  postType: "single" | "thread";
  provider?: AiProvider;
  client?: AiClient;
}): Promise<GeneratedContent> {
  const ai = input.client ?? getAiClient(input.provider);
  const isThread = input.postType === "thread";

  const system = [
    "Kamu adalah content creator Threads berbahasa Indonesia yang jago menulis konten viral namun bernilai.",
    "Gaya menulis: natural, mengalir, tidak kaku, tidak terdengar seperti AI.",
    "Hindari klise, jangan berlebihan pakai emoji (maksimal 1-2 bila perlu).",
  ].join(" ");

  const shape = isThread
    ? `"post_type": "thread", "segments": ["post 1 (hook)", "post 2", "... 4-7 post total, tiap post < 480 karakter"]`
    : `"post_type": "single", "segments": ["satu post utuh < 480 karakter"]`;

  const prompt = [
    `PERSONA: ${input.persona.name}${input.persona.tone ? ` (tone: ${input.persona.tone})` : ""}${
      input.persona.audience ? `, audiens: ${input.persona.audience}` : ""
    }`,
    input.persona.cta ? `CTA persona: ${input.persona.cta}` : "",
    "",
    `IDE:`,
    `- Judul: ${input.idea.title}`,
    input.idea.angle ? `- Angle: ${input.idea.angle}` : "",
    input.idea.hook ? `- Hook: ${input.idea.hook}` : "",
    "",
    `Tulis konten Threads bertipe ${input.postType.toUpperCase()}.`,
    `Sertakan juga skor viral (1-10) dan 1-3 komentar pemicu diskusi.`,
    `Balas HANYA JSON valid:`,
    `{"title": "judul konten", ${shape}, "viral_score": 8, "suggested_comments": ["komentar 1", "komentar 2"]}`,
  ]
    .filter(Boolean)
    .join("\n");

  const text = await ai.generateText({ system, prompt, json: true, temperature: 0.9 });
  const raw = parseJsonLoose<Partial<GeneratedContent>>(text);

  let segments = Array.isArray(raw.segments) ? raw.segments.map((s) => String(s).trim()).filter(Boolean) : [];
  if (segments.length === 0) segments = [String(raw.title ?? input.idea.title)];
  if (!isThread) segments = [segments.join("\n\n")];

  const score = Number(raw.viral_score);
  return {
    title: String(raw.title ?? input.idea.title).trim(),
    post_type: input.postType,
    segments,
    viral_score: Number.isFinite(score) ? Math.min(10, Math.max(1, Math.round(score))) : 7,
    suggested_comments: Array.isArray(raw.suggested_comments)
      ? raw.suggested_comments.map((c) => String(c).trim()).filter(Boolean).slice(0, 3)
      : [],
  };
}
