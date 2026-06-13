"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import type { Enums } from "@/lib/database.types";

type Role = Enums<"workspace_role_t">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Create a one-time invite link for a specific email (admin only, enforced by RLS). */
export async function createInvite(
  role: Role,
  email: string,
): Promise<{ ok: boolean; token?: string; email?: string; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) {
    return { ok: false, error: "Masukkan email orang yang ingin kamu undang." };
  }

  const ws = await getCurrentWorkspaceId();
  const sb = await createClient();

  // Block re-inviting an email that already has an open invite for this workspace.
  const { data: dupe } = await sb
    .from("invites")
    .select("id")
    .eq("workspace_id", ws)
    .eq("email", cleanEmail)
    .is("accepted_at", null)
    .maybeSingle();
  if (dupe) return { ok: false, error: `Sudah ada undangan aktif untuk ${cleanEmail}.` };

  const { data, error } = await sb
    .from("invites")
    .insert({ workspace_id: ws, role, email: cleanEmail })
    .select("token")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pengaturan");
  return { ok: true, token: data?.token, email: cleanEmail };
}

export async function revokeInvite(id: string): Promise<{ ok: boolean; error?: string }> {
  const sb = await createClient();
  const { error } = await sb.from("invites").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pengaturan");
  return { ok: true };
}
