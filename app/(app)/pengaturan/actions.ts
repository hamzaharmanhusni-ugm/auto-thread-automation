"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import type { Enums } from "@/lib/database.types";

type Role = Enums<"workspace_role_t">;

/** Create a one-time invite link (admin only, enforced by RLS). */
export async function createInvite(role: Role): Promise<{ ok: boolean; token?: string; error?: string }> {
  const ws = await getCurrentWorkspaceId();
  const sb = await createClient();
  const { data, error } = await sb
    .from("invites")
    .insert({ workspace_id: ws, role })
    .select("token")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pengaturan");
  return { ok: true, token: data?.token };
}

export async function revokeInvite(id: string): Promise<{ ok: boolean; error?: string }> {
  const sb = await createClient();
  const { error } = await sb.from("invites").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pengaturan");
  return { ok: true };
}
