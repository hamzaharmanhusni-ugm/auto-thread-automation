"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getReplizClientForWorkspace } from "@/lib/repliz/resolve";
import type { TablesInsert } from "@/lib/database.types";

type Result = { ok: boolean; error?: string };

/** Auto-generate a fresh MCP bearer token for this workspace (used when env MCP_AUTH_TOKEN is unset). */
export async function generateMcpToken(): Promise<{ ok: boolean; token?: string; error?: string }> {
  if (process.env.MCP_AUTH_TOKEN) {
    return { ok: false, error: "Token sudah diatur lewat environment (.env), tidak bisa diubah dari sini." };
  }
  const ws = await getCurrentWorkspaceId();
  const sb = await createClient();
  const token = `tg_${randomBytes(24).toString("base64url")}`;
  const { error } = await sb
    .from("workspace_settings")
    .upsert({ workspace_id: ws, mcp_auth_token: token }, { onConflict: "workspace_id" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pengaturan");
  return { ok: true, token };
}

/** Save a manually-typed MCP bearer token for this workspace. */
export async function saveMcpToken(token: string): Promise<Result> {
  if (process.env.MCP_AUTH_TOKEN) {
    return { ok: false, error: "Token sudah diatur lewat environment (.env), tidak bisa diubah dari sini." };
  }
  const ws = await getCurrentWorkspaceId();
  const sb = await createClient();
  const t = token.trim();
  if (t.length < 12) return { ok: false, error: "Token minimal 12 karakter agar aman." };
  if (/\s/.test(t)) return { ok: false, error: "Token tidak boleh mengandung spasi." };
  const { error } = await sb
    .from("workspace_settings")
    .upsert({ workspace_id: ws, mcp_auth_token: t }, { onConflict: "workspace_id" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pengaturan");
  return { ok: true };
}

/** Save the workspace's Repliz username/password (used for schedule + auto-comment). */
export async function saveReplizCredentials(username: string, password: string): Promise<Result> {
  const ws = await getCurrentWorkspaceId();
  const sb = await createClient();
  const u = username.trim();
  const p = password.trim();
  if (!u || !p) return { ok: false, error: "Username dan password Repliz wajib diisi." };

  const { data: existing } = await sb
    .from("repliz_credentials")
    .select("id")
    .eq("workspace_id", ws)
    .eq("is_default", true)
    .maybeSingle();

  const row = { workspace_id: ws, username_enc: u, password_enc: p, is_default: true, label: "Default" };
  const { error } = existing
    ? await sb.from("repliz_credentials").update(row).eq("id", existing.id)
    : await sb.from("repliz_credentials").insert(row);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/pengaturan");
  return { ok: true };
}

/** Test the currently saved (or env) Repliz credentials by listing accounts. */
export async function testReplizConnection(): Promise<{ ok: boolean; accounts?: number; error?: string }> {
  const ws = await getCurrentWorkspaceId();
  const repliz = await getReplizClientForWorkspace(ws);
  if (!repliz) return { ok: false, error: "Kredensial Repliz belum diatur." };
  try {
    const { docs } = await repliz.listAccounts({ page: 1, limit: 50, type: "threads" });
    return { ok: true, accounts: docs.filter((d) => d.type === "threads").length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Koneksi gagal." };
  }
}

/** Save AI keys/provider for the workspace (Pengaturan → Kunci AI). */
export async function saveAiSettings(input: {
  provider: "gemini" | "openai" | "claude";
  geminiApiKey?: string;
  geminiModel?: string;
}): Promise<Result> {
  const ws = await getCurrentWorkspaceId();
  const sb = await createClient();
  const patch: TablesInsert<"workspace_settings"> = {
    workspace_id: ws,
    default_ai_provider: input.provider,
  };
  // Only overwrite the key when a new value is provided (keep existing otherwise).
  if (input.geminiApiKey && input.geminiApiKey.trim()) patch.gemini_api_key = input.geminiApiKey.trim();
  if (input.geminiModel !== undefined) patch.gemini_model = input.geminiModel.trim() || null;

  const { error } = await sb.from("workspace_settings").upsert(patch, { onConflict: "workspace_id" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pengaturan");
  return { ok: true };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n || 0)));

/** Save automation config: posts/day, auto-comment count, daily post hour (WIB). */
export async function saveAutomationSettings(input: {
  postsPerDay: number;
  autoCommentCount: number;
  dailyPostHour: number;
}): Promise<Result> {
  const ws = await getCurrentWorkspaceId();
  const sb = await createClient();
  const { error } = await sb.from("workspace_settings").upsert(
    {
      workspace_id: ws,
      posts_per_day: clamp(input.postsPerDay, 0, 50), // well under Threads' ~250/24h cap
      auto_comment_count: clamp(input.autoCommentCount, 0, 50),
      daily_post_hour: clamp(input.dailyPostHour, 0, 23),
    },
    { onConflict: "workspace_id" },
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pengaturan");
  return { ok: true };
}
