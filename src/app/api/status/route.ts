import { NextResponse } from "next/server";
import { countWords, normalizePhone } from "@/lib/join/schema";
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
    const identifier = String(body?.identifier ?? body?.phone ?? "")
      .trim()
      .replace(/\s+/g, " ");
    if (!identifier || identifier.length > 120) {
      return reply(
        {
          ok: false,
          message:
            "Enter the email, full name, or phone number you registered with.",
        },
        422,
      );
    }

    const phone = normalizePhone(identifier);
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(identifier)
      ? identifier.toLowerCase()
      : null;
    const fullName = !phone && !email ? identifier : null;
    if (fullName && countWords(fullName) < 2) {
      return reply(
        {
          ok: false,
          message: "Enter your full name, email, or a valid mobile number.",
        },
        422,
      );
    }

    const rateKey = phone ?? email ?? fullName?.toLowerCase() ?? identifier;
    if (!rateLimit(`status-identifier:${rateKey}`, 6, WINDOW)) {
      return reply(
        { ok: false, message: "Too many tries. Please wait a few minutes." },
        429,
      );
    }

    const query = getServiceClient()
      .from("registrations")
      .select("role, status, banned, created_at")
      .in("role", ["artist", "visitor"])
      .order("created_at", { ascending: false });
    const escapedName = fullName
      ?.replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");
    const { data, error } = phone
      ? await query.eq("phone", phone)
      : email
        ? await query.eq("email", email)
        : await query.ilike("full_name", escapedName!);
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
