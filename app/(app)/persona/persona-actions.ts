"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";

type Result = { ok: boolean; error?: string; id?: string };

export type PersonaFormInput = {
  accountId: string;
  name: string;
  niche?: string;
  tone?: string;
  audience?: string;
  cta?: string;
  communicationStyle?: string;
  description?: string;
  isDefault?: boolean;
};

function clean(v?: string) {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}

/** Create a persona for an account. The account's first persona becomes the default automatically. */
export async function createPersona(input: PersonaFormInput): Promise<Result> {
  if (!input.accountId) return { ok: false, error: "Pilih akun dulu." };
  if (!input.name?.trim()) return { ok: false, error: "Nama persona wajib diisi." };

  const ws = await getCurrentWorkspaceId();
  const sb = await createClient();

  const { count } = await sb
    .from("personas")
    .select("id", { count: "exact", head: true })
    .eq("account_id", input.accountId);
  const makeDefault = input.isDefault || (count ?? 0) === 0;

  if (makeDefault) {
    await sb.from("personas").update({ is_default: false }).eq("account_id", input.accountId);
  }

  const { data, error } = await sb
    .from("personas")
    .insert({
      workspace_id: ws,
      account_id: input.accountId,
      name: input.name.trim(),
      niche: clean(input.niche),
      tone: clean(input.tone),
      audience: clean(input.audience),
      cta: clean(input.cta),
      communication_style: clean(input.communicationStyle),
      description: clean(input.description),
      is_default: makeDefault,
    })
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/persona");
  revalidatePath("/riset");
  revalidatePath("/akun");
  revalidatePath("/dashboard");
  return { ok: true, id: data?.id };
}

/** Update an existing persona (account is fixed). */
export async function updatePersona(id: string, input: Omit<PersonaFormInput, "accountId">): Promise<Result> {
  if (!input.name?.trim()) return { ok: false, error: "Nama persona wajib diisi." };
  const sb = await createClient();

  if (input.isDefault) {
    const { data: p } = await sb.from("personas").select("account_id").eq("id", id).maybeSingle();
    if (p?.account_id) await sb.from("personas").update({ is_default: false }).eq("account_id", p.account_id);
  }

  const { error } = await sb
    .from("personas")
    .update({
      name: input.name.trim(),
      niche: clean(input.niche),
      tone: clean(input.tone),
      audience: clean(input.audience),
      cta: clean(input.cta),
      communication_style: clean(input.communicationStyle),
      description: clean(input.description),
      ...(input.isDefault ? { is_default: true } : {}),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/persona");
  revalidatePath("/riset");
  return { ok: true, id };
}

/** Delete a persona. If it was the default, promote the account's oldest remaining persona. */
export async function deletePersona(id: string): Promise<Result> {
  const sb = await createClient();
  const { data: p } = await sb.from("personas").select("account_id, is_default").eq("id", id).maybeSingle();

  const { error } = await sb.from("personas").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (p?.is_default && p.account_id) {
    const { data: next } = await sb
      .from("personas")
      .select("id")
      .eq("account_id", p.account_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next?.id) await sb.from("personas").update({ is_default: true }).eq("id", next.id);
  }

  revalidatePath("/persona");
  revalidatePath("/riset");
  revalidatePath("/akun");
  return { ok: true };
}
