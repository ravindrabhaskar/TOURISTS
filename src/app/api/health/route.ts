import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await db.$queryRaw`SELECT 1`;
    checks.db = "up";
  } catch {
    checks.db = "down";
    healthy = false;
  }

  return NextResponse.json(
    {
      ok: healthy,
      status: healthy ? "healthy" : "degraded",
      checks,
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
