import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * The MCP server operates on the single internal workspace (oldest = the
 * seeded "ThreadsGrowth AI" workspace). Used by the read-only MCP tools.
 */
export async function getDefaultWorkspaceId(): Promise<string> {
  const sb = createServiceRoleClient();
  const { data, error } = await sb
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new Error("No workspace found");
  return data.id;
}
