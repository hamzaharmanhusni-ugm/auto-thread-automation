import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAiClient, type AiClient } from "./provider";

/**
 * Resolve an AI client for a workspace: prefer the key/model saved in the app
 * (Pengaturan → Kunci AI, table `workspace_settings`), else fall back to env.
 */
export async function getAiClientForWorkspace(workspaceId: string): Promise<AiClient> {
  const sb = createServiceRoleClient();
  const { data } = await sb
    .from("workspace_settings")
    .select("default_ai_provider, gemini_api_key, gemini_model")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (data?.gemini_api_key) {
    return getAiClient(data.default_ai_provider, {
      apiKey: data.gemini_api_key,
      model: data.gemini_model ?? undefined,
    });
  }
  return getAiClient(data?.default_ai_provider);
}
