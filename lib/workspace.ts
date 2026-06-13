import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the current user's workspace id.
 * - First-ever user bootstraps as admin (owner).
 * - Existing members get their workspace.
 * - Signed-in users who are NOT members (and not the first user) are redirected
 *   to /no-access — they must be invited (see invites flow).
 */
export async function getCurrentWorkspaceId(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ensure_default_membership");
  if (error) throw error;
  if (!data) redirect("/no-access");
  return data as string;
}
