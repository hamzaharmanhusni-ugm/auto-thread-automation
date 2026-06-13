import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getDefaultWorkspaceId } from "@/lib/mcp/workspace";
import { planUpcomingSchedules } from "@/lib/auto-schedule/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Effective cron secret: env first, else the default workspace's UI-set value. */
async function resolveCronSecret(sb: ReturnType<typeof createServiceRoleClient>): Promise<string | null> {
  if (process.env.CRON_SECRET) return process.env.CRON_SECRET;
  try {
    const ws = await getDefaultWorkspaceId();
    const { data } = await sb.from("workspace_settings").select("cron_secret").eq("workspace_id", ws).maybeSingle();
    return data?.cron_secret || null;
  } catch {
    return null;
  }
}

/**
 * Cron runner: pre-schedules drafts into the workspace's upcoming weekly posting
 * slots (pushes to Repliz, which publishes at the slot time).
 * Auth: `Authorization: Bearer <CRON_SECRET>` or `?key=<CRON_SECRET>`.
 */
async function run(req: NextRequest) {
  const sb = createServiceRoleClient();
  const secret = await resolveCronSecret(sb);
  if (!secret) {
    return NextResponse.json(
      { error: "Cron belum aktif. Set CRON_SECRET (env) atau buat token di Pengaturan." },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.replace(/^Bearer\s+/i, "") || req.nextUrl.searchParams.get("key") || "";
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ws = await getDefaultWorkspaceId();
  const res = await planUpcomingSchedules(sb, { workspaceId: ws, lookaheadHours: 48 });
  return NextResponse.json({ ok: true, ...res });
}

export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}
