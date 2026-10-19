import { NextResponse } from "next/server";
import { purgeOrphanIds } from "@/lib/admin/privacy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Called once a day by Vercel Cron. Without the secret it refuses everybody. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const orphans = await purgeOrphanIds();
  return NextResponse.json({ ok: true, orphans });
}
