import { getAiClient, type AiProvider, type AiClient } from "./provider";

export type PersonaInput = {
  name: string;
  description?: string | null;
  tone?: string | null;
  audience?: string | null;
  niche?: string | null;
  cta?: string | null;
};

export type GeneratedIdea = { title: string; angle: string; hook: string };

/** Strip ```json fences and parse, tolerating object-or-array shapes. */
export function parseJsonLoose<T = unknown>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

/**
 * Generate fresh content ideas for a persona, avoiding duplicates of recent titles
 * (replaces n8n WF1 "Riset Ide Konten").
 */
export async function generateIdeas(input: {
  persona: PersonaInput;
  recentTitles: string[];
  count: number;
  provider?: AiProvider;
  client?: AiClient;
}): Promise<GeneratedIdea[]> {
  const ai = input.client ?? getAiClient(input.provider);

  const system = [
    "Kamu adalah ahli strategi konten Threads berbahasa Indonesia.",
    "Tugasmu menghasilkan ide konten yang relevan dengan persona, segar, dan berpotensi viral.",
    "Selalu pakai Bahasa Indonesia yang natural dan tidak kaku.",
    "JANGAN mengulang ide/topik yang sudah ada di daftar konten terakhir.",
  ].join(" ");

  const prompt = [
    `PERSONA:`,
    `- Nama: ${input.persona.name}`,
    input.persona.niche ? `- Niche: ${input.persona.niche}` : "",
    input.persona.description ? `- Deskripsi: ${input.persona.description}` : "",
    input.persona.tone ? `- Tone: ${input.persona.tone}` : "",
    input.persona.audience ? `- Audiens: ${input.persona.audience}` : "",
    input.persona.cta ? `- CTA: ${input.persona.cta}` : "",
    "",
    `KONTEN TERAKHIR (hindari duplikasi tema ini):`,
    input.recentTitles.length ? input.recentTitles.map((t) => `- ${t}`).join("\n") : "- (belum ada)",
    "",
    `Buat ${input.count} IDE konten BARU yang berbeda dari di atas.`,
    `Balas HANYA JSON valid berbentuk array:`,
    `[{"title": "judul singkat", "angle": "sudut pandang/insight unik", "hook": "kalimat pembuka yang memancing"}]`,
  ]
    .filter(Boolean)
    .join("\n");

  const text = await ai.generateText({ system, prompt, json: true, temperature: 0.95 });
  const parsed = parseJsonLoose<GeneratedIdea[] | { ideas?: GeneratedIdea[] }>(text);
  const arr = Array.isArray(parsed) ? parsed : (parsed.ideas ?? []);
  return arr
    .filter((i) => i && i.title)
    .slice(0, input.count)
    .map((i) => ({
      title: String(i.title).trim(),
      angle: String(i.angle ?? "").trim(),
      hook: String(i.hook ?? "").trim(),
    }));
}
