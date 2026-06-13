import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getDefaultWorkspaceId } from "@/lib/mcp/workspace";
import { getReplizClientForWorkspace } from "@/lib/repliz/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ThreadsGrowth AI MCP server (Streamable HTTP).
 *
 * This is the PRIMARY generation engine: connect Claude Desktop / Claude Code,
 * and Claude reads context (persona, recent titles, settings) and WRITES ideas,
 * content (single/nested), schedules, and comment replies through these tools.
 *
 * Endpoint: POST/GET /api/mcp   ·   Auth: Bearer MCP_AUTH_TOKEN. See docs/MCP.md.
 */
const ok = (obj: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] });

const mcpHandler = createMcpHandler(
  (server) => {
    // ---------- READ / CONTEXT ----------
    server.tool("get_stats", "Ringkasan metrik: akun, konten per status, ide, komentar pending.", {}, async () => {
      const sb = createServiceRoleClient();
      const ws = await getDefaultWorkspaceId();
      const head = { count: "exact" as const, head: true };
      const [accounts, total, posted, scheduled, ideas, pending] = await Promise.all([
        sb.from("accounts").select("*", head).eq("workspace_id", ws),
        sb.from("contents").select("*", head).eq("workspace_id", ws),
        sb.from("contents").select("*", head).eq("workspace_id", ws).eq("status", "posted"),
        sb.from("contents").select("*", head).eq("workspace_id", ws).eq("status", "scheduled"),
        sb.from("content_ideas").select("*", head).eq("workspace_id", ws),
        sb.from("comments").select("*", head).eq("workspace_id", ws).eq("reply_status", "pending"),
      ]);
      return ok({
        accounts: accounts.count ?? 0,
        contents_total: total.count ?? 0,
        contents_posted: posted.count ?? 0,
        contents_scheduled: scheduled.count ?? 0,
        ideas: ideas.count ?? 0,
        comments_pending: pending.count ?? 0,
      });
    });

    server.tool("list_accounts", "Daftar akun Threads terhubung (id, username, status, mode balas).", {}, async () => {
      const sb = createServiceRoleClient();
      const ws = await getDefaultWorkspaceId();
      const { data } = await sb
        .from("accounts")
        .select("id, username, display_name, status, auto_reply_mode, platform")
        .eq("workspace_id", ws);
      return ok(data ?? []);
    });

    server.tool(
      "get_persona",
      "Detail persona sebuah akun (untuk konteks generate). Beri account_id dari list_accounts.",
      { account_id: z.string() },
      async ({ account_id }) => {
        const sb = createServiceRoleClient();
        const ws = await getDefaultWorkspaceId();
        const { data } = await sb
          .from("personas")
          .select("id, name, description, tone, audience, niche, cta, communication_style")
          .eq("account_id", account_id)
          .eq("workspace_id", ws)
          .order("is_default", { ascending: false })
          .limit(1)
          .maybeSingle();
        return ok(data ?? { error: "Persona tidak ditemukan untuk akun ini." });
      },
    );

    server.tool(
      "list_recent_titles",
      "Judul konten terakhir sebuah akun (untuk menghindari duplikasi ide).",
      { account_id: z.string(), limit: z.number().int().min(1).max(50).optional() },
      async ({ account_id, limit }) => {
        const sb = createServiceRoleClient();
        const ws = await getDefaultWorkspaceId();
        const { data } = await sb
          .from("contents")
          .select("title, created_at")
          .eq("workspace_id", ws)
          .eq("account_id", account_id)
          .order("created_at", { ascending: false })
          .limit(limit ?? 20);
        return ok((data ?? []).map((c) => c.title).filter(Boolean));
      },
    );

    server.tool(
      "get_automation_settings",
      "Pengaturan otomasi: target posting/hari, jumlah akun auto-comment, jam posting harian (WIB).",
      {},
      async () => {
        const sb = createServiceRoleClient();
        const ws = await getDefaultWorkspaceId();
        const { data } = await sb
          .from("workspace_settings")
          .select("posts_per_day, auto_comment_count, daily_post_hour, default_ai_provider")
          .eq("workspace_id", ws)
          .maybeSingle();
        return ok(
          data ?? { posts_per_day: 3, auto_comment_count: 0, daily_post_hour: 8, default_ai_provider: "gemini" },
        );
      },
    );

    server.tool(
      "list_pending_comments",
      "Komentar masuk yang belum dibalas (id, teks, pengomentar).",
      { limit: z.number().int().min(1).max(50).optional() },
      async ({ limit }) => {
        const sb = createServiceRoleClient();
        const ws = await getDefaultWorkspaceId();
        const { data } = await sb
          .from("comments")
          .select("id, commenter_username, comment_text, repliz_content_id, received_at")
          .eq("workspace_id", ws)
          .eq("reply_status", "pending")
          .order("received_at", { ascending: false })
          .limit(limit ?? 20);
        return ok(data ?? []);
      },
    );

    server.tool(
      "list_content_ideas",
      "Ide konten. Filter opsional status (draft/approved/rejected/used).",
      { status: z.enum(["draft", "approved", "rejected", "used"]).optional() },
      async ({ status }) => {
        const sb = createServiceRoleClient();
        const ws = await getDefaultWorkspaceId();
        let q = sb.from("content_ideas").select("id, title, angle, hook, status, account_id").eq("workspace_id", ws);
        if (status) q = q.eq("status", status);
        const { data } = await q.order("created_at", { ascending: false }).limit(50);
        return ok(data ?? []);
      },
    );

    // ---------- WRITE (generation) ----------
    server.tool(
      "create_idea",
      "Simpan satu ide konten baru untuk sebuah akun.",
      {
        account_id: z.string(),
        title: z.string(),
        angle: z.string().optional(),
        hook: z.string().optional(),
      },
      async ({ account_id, title, angle, hook }) => {
        const sb = createServiceRoleClient();
        const ws = await getDefaultWorkspaceId();
        const { data: acc } = await sb
          .from("accounts")
          .select("workspace_id")
          .eq("id", account_id)
          .maybeSingle();
        if (!acc || acc.workspace_id !== ws) return ok({ error: "Akun tidak valid." });
        const { data: persona } = await sb
          .from("personas")
          .select("id")
          .eq("account_id", account_id)
          .order("is_default", { ascending: false })
          .limit(1)
          .maybeSingle();
        const { data, error } = await sb
          .from("content_ideas")
          .insert({
            account_id,
            persona_id: persona?.id ?? null,
            workspace_id: ws,
            title,
            angle: angle ?? null,
            hook: hook ?? null,
            status: "draft",
          })
          .select("id")
          .maybeSingle();
        return ok(error ? { error: error.message } : { ok: true, idea_id: data?.id });
      },
    );

    server.tool(
      "create_content",
      "Simpan konten siap jadwal. post_type: 'single' (1 segmen) atau 'thread' (nested, banyak segmen).",
      {
        account_id: z.string(),
        title: z.string(),
        post_type: z.enum(["single", "thread"]),
        segments: z.array(z.string()).min(1),
        viral_score: z.number().int().min(1).max(10).optional(),
        suggested_comments: z.array(z.string()).optional(),
      },
      async ({ account_id, title, post_type, segments, viral_score, suggested_comments }) => {
        const sb = createServiceRoleClient();
        const ws = await getDefaultWorkspaceId();
        const { data: acc } = await sb
          .from("accounts")
          .select("workspace_id")
          .eq("id", account_id)
          .maybeSingle();
        if (!acc || acc.workspace_id !== ws) return ok({ error: "Akun tidak valid." });

        const segs = post_type === "single" ? [segments.join("\n\n")] : segments;
        const { data: persona } = await sb
          .from("personas")
          .select("id")
          .eq("account_id", account_id)
          .order("is_default", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: content, error } = await sb
          .from("contents")
          .insert({
            account_id,
            persona_id: persona?.id ?? null,
            workspace_id: ws,
            title,
            body: segs[0],
            post_type,
            status: "draft",
            viral_score: viral_score ?? null,
            suggested_comments: suggested_comments?.length ? suggested_comments : null,
          })
          .select("id")
          .maybeSingle();
        if (error || !content) return ok({ error: error?.message ?? "Gagal menyimpan konten." });

        await sb.from("content_segments").insert(
          segs.map((body, i) => ({ content_id: content.id, workspace_id: ws, position: i, body })),
        );
        return ok({ ok: true, content_id: content.id, post_type });
      },
    );

    server.tool(
      "schedule_content",
      "Jadwalkan konten pada waktu tertentu (ISO 8601 UTC). Worker akan memposting ke Repliz.",
      { content_id: z.string(), scheduled_at: z.string() },
      async ({ content_id, scheduled_at }) => {
        const sb = createServiceRoleClient();
        const ws = await getDefaultWorkspaceId();
        const { data: content } = await sb
          .from("contents")
          .select("account_id, workspace_id")
          .eq("id", content_id)
          .maybeSingle();
        if (!content || content.workspace_id !== ws) return ok({ error: "Konten tidak valid." });
        const { error } = await sb.from("schedules").insert({
          content_id,
          account_id: content.account_id,
          workspace_id: ws,
          scheduled_at,
          status: "pending",
        });
        if (error) return ok({ error: error.message });
        await sb.from("contents").update({ status: "scheduled" }).eq("id", content_id);
        return ok({ ok: true, scheduled_at });
      },
    );

    server.tool(
      "submit_comment_reply",
      "Balas komentar masuk: kirim teks ke Repliz dan tandai sudah dibalas.",
      { comment_id: z.string(), text: z.string() },
      async ({ comment_id, text }) => {
        const sb = createServiceRoleClient();
        const ws = await getDefaultWorkspaceId();
        const { data: c } = await sb
          .from("comments")
          .select("repliz_comment_record_id, workspace_id")
          .eq("id", comment_id)
          .maybeSingle();
        if (!c || c.workspace_id !== ws || !c.repliz_comment_record_id) {
          return ok({ error: "Komentar tidak valid." });
        }
        const repliz = await getReplizClientForWorkspace(ws);
        if (!repliz) return ok({ error: "Kredensial Repliz belum diatur." });
        try {
          await repliz.replyComment(c.repliz_comment_record_id, text);
          await sb
            .from("comments")
            .update({ ai_reply: text, reply_status: "replied", replied_at: new Date().toISOString() })
            .eq("id", comment_id);
          return ok({ ok: true });
        } catch (e) {
          return ok({ error: e instanceof Error ? e.message : "Gagal mengirim balasan." });
        }
      },
    );
  },
  {},
  { basePath: "/api" },
);

/** Bearer-token gate. Returns null when authorized, or a 401/503 Response. */
function checkAuth(req: Request): Response | null {
  const token = process.env.MCP_AUTH_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "MCP not configured (set MCP_AUTH_TOKEN)" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.replace(/^Bearer\s+/i, "");
  if (provided !== token) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json", "www-authenticate": "Bearer" },
    });
  }
  return null;
}

async function guarded(req: Request) {
  const denied = checkAuth(req);
  if (denied) return denied;
  return mcpHandler(req);
}

export { guarded as GET, guarded as POST, guarded as DELETE };
