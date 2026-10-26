import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/join/schema";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  try {
    const WINDOW = 10 * 60 * 1000;
    if (!rateLimit(`status:${clientIp(req)}`, 12, WINDOW)) {
      return reply(
        { ok: false, message: "Too many tries. Please wait a few minutes." },
        429,
      );
    }

    const body = await req.json().catch(() => null);
    const phone = normalizePhone(String(body?.phone ?? ""));
    if (!phone) {
      return reply(
        {
          ok: false,
          message: "That doesn't look like a mobile number. Try 0555 12 34 56.",
        },
        422,
      );
    }
    if (!rateLimit(`status-phone:${phone}`, 6, WINDOW)) {
      return reply(
        { ok: false, message: "Too many tries. Please wait a few minutes." },
        429,
      );
    }

    const { data, error } = await getServiceClient()
      .from("registrations")
      .select("role, status, banned, created_at")
      .eq("phone", phone)
      .in("role", ["artist", "visitor"])
      .order("created_at", { ascending: false });
    if (error) throw error;

    // newest registration per role. A banned person just sees "not this time".
    const seen = new Set<string>();
    const results: { role: string; status: string }[] = [];
    for (const r of data ?? []) {
      if (seen.has(r.role)) continue;
      seen.add(r.role);
      const status = r.banned
        ? "rejected"
        : r.status === "accepted" || r.status === "rejected"
          ? r.status
          : "pending";
      results.push({ role: r.role, status });
    }

    return reply({ ok: true, results });
  } catch (err) {
    console.error(err);
    return reply(
      { ok: false, message: "Something went wrong. Please try again." },
      500,
    );
  }
}
