"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

function humanizeAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already") || m.includes("registered")) return "Email ini sudah terdaftar. Silakan masuk.";
  if (m.includes("password")) return "Kata sandi terlalu lemah (minimal 6 karakter).";
  if (m.includes("invalid") && m.includes("email")) return "Format email tidak valid.";
  return msg;
}

/**
 * Register an account securely (server-side, no public client sign-up).
 * - During initial setup (no members yet): only USER_EMAIL_DEFAULT may register,
 *   and that account becomes the first admin/owner.
 * - After setup: only allowed when USER_ALLOW_REGISTRATION=true (otherwise invite-only).
 */
export async function registerAccount(email: string, password: string): Promise<Result> {
  const cleanEmail = email.trim().toLowerCase();
  const sb = await createClient();
  const { data: setupNeeded } = await sb.rpc("is_setup_needed");
  const openReg = process.env.USER_ALLOW_REGISTRATION === "true";

  if (!setupNeeded && !openReg) {
    return { ok: false, error: "Pendaftaran tertutup. Minta admin mengirimkan tautan undangan." };
  }

  if (setupNeeded) {
    const allowed = process.env.USER_EMAIL_DEFAULT?.trim().toLowerCase();
    if (allowed && cleanEmail !== allowed) {
      return { ok: false, error: `Hanya ${allowed} yang dapat mendaftar sebagai admin pertama.` };
    }
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true, // no email verification step (friendly for non-tech)
  });
  if (error) return { ok: false, error: humanizeAuthError(error.message) };
  return { ok: true };
}

/** Register (or reuse) an account via an invite token, then it can accept the invite. */
export async function registerViaInvite(
  token: string,
  email: string,
  password: string,
): Promise<Result> {
  const cleanEmail = email.trim().toLowerCase();
  const sb = await createClient();
  const { data } = await sb.rpc("invite_info", { p_token: token });
  const info = (data ?? {}) as { valid?: boolean };
  if (!info.valid) return { ok: false, error: "Undangan tidak berlaku atau sudah dipakai." };

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
  });
  // If the email already has an account, let them sign in & accept.
  if (error && !/already|registered/i.test(error.message)) {
    return { ok: false, error: humanizeAuthError(error.message) };
  }
  return { ok: true };
}
