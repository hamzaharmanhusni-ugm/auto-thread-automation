import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Lightweight health probe for uptime checks / deploy verification. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "threadsgrowth-ai",
    time: new Date().toISOString(),
  });
}
