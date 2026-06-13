import { createServiceRoleClient } from "@/lib/supabase/server";
import { ReplizClient, replizFromEnv } from "./client";

/**
 * Resolve a ReplizClient for a workspace: prefer the workspace's stored
 * credentials (`repliz_credentials`), else fall back to the global env creds.
 *
 * NOTE: credentials should be encrypted at rest in production (pgsodium/Vault).
 * For now username_enc/password_enc are treated as the stored values.
 */
export async function getReplizClientForWorkspace(workspaceId: string): Promise<ReplizClient | null> {
  const sb = createServiceRoleClient();
  const { data } = await sb
    .from("repliz_credentials")
    .select("username_enc, password_enc")
    .eq("workspace_id", workspaceId)
    .eq("is_default", true)
    .maybeSingle();

  if (data?.username_enc && data?.password_enc) {
    return new ReplizClient({ username: data.username_enc, password: data.password_enc });
  }
  return replizFromEnv();
}
