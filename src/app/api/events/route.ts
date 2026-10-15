import { NextResponse } from "next/server";
import { getPublicEvents } from "@/lib/publicEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public list of events. The banner on Home and Menu reads it. */
export async function GET() {
  return NextResponse.json(
    { events: await getPublicEvents() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
