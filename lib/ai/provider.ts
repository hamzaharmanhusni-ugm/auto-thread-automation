// AI provider abstraction. Default = Gemini (per CLAUDE.md). OpenAI/Claude are
// pluggable later behind the same interface. Keep callers provider-agnostic.

import { GoogleGenerativeAI } from "@google/generative-ai";

export type AiProvider = "gemini" | "openai" | "claude";

export type GenerateOptions = {
  system?: string;
  prompt: string;
  temperature?: number;
  json?: boolean;
};

export interface AiClient {
  readonly provider: AiProvider;
  generateText(opts: GenerateOptions): Promise<string>;
  embed(text: string): Promise<number[]>; // 768-dim (pgvector column)
}

class GeminiClient implements AiClient {
  readonly provider = "gemini" as const;
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, model?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = model || process.env.GEMINI_MODEL || "gemini-2.0-flash";
  }

  async generateText({ system, prompt, temperature = 0.8, json = false }: GenerateOptions) {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: system,
      generationConfig: {
        temperature,
        ...(json ? { responseMimeType: "application/json" } : {}),
      },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async embed(text: string) {
    const model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBED_MODEL || "text-embedding-004",
    });
    const result = await model.embedContent(text);
    return result.embedding.values; // 768 dims
  }
}

/** Resolve the configured AI client. Falls back to Gemini + env key. */
export function getAiClient(provider?: AiProvider, opts?: { apiKey?: string; model?: string }): AiClient {
  const chosen = provider ?? (process.env.AI_PROVIDER_DEFAULT as AiProvider) ?? "gemini";
  switch (chosen) {
    case "gemini":
    default: {
      const key = opts?.apiKey || process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("Kunci Gemini belum diatur. Tambahkan di Pengaturan → Kunci AI atau GEMINI_API_KEY.");
      }
      return new GeminiClient(key, opts?.model);
    }
    // case "openai": return new OpenAiClient(...)
    // case "claude": return new ClaudeClient(...)
  }
}
