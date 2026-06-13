"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getReplizClientForWorkspace } from "@/lib/repliz/resolve";

type SyncResult = { ok: boolean; synced?: number; error?: string };

/** Sync Threads accounts from Repliz into the workspace (replaces n8n WF "Tambah Akun"). */
export async function syncAccounts(): Promise<SyncResult> {
  const workspaceId = await getCurrentWorkspaceId();
  const repliz = await getReplizClientForWorkspace(workspaceId);
  if (!repliz) {
    return { ok: false, error: "Kredensial Repliz belum diatur. Isi di Pengaturan atau .env." };
  }

  try {
    const { docs } = await repliz.listAccounts({ page: 1, limit: 50, type: "threads" });
    const threads = docs.filter((d) => d.type === "threads");

    const sb = createServiceRoleClient();
    const rows = threads.map((a) => ({
      workspace_id: workspaceId,
      platform: "threads" as const,
      repliz_account_id: a._id,
      repliz_user_id: a.userId ?? null,
      username: a.username ?? a.name ?? null,
      display_name: a.name ?? a.username ?? null,
      avatar_url: a.picture ?? null,
      status: a.isConnected === false ? ("disconnected" as const) : ("active" as const),
      last_synced_at: new Date().toISOString(),
      raw: a as never,
    }));

    if (rows.length > 0) {
      const { error } = await sb
        .from("accounts")
        .upsert(rows, { onConflict: "workspace_id,platform,repliz_account_id" });
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath("/akun");
    revalidatePath("/dashboard");
    return { ok: true, synced: rows.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Gagal sinkronisasi." };
  }
}
