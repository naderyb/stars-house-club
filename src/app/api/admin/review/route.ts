import { NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ["pending", "accepted", "rejected"];

export async function POST(req: Request) {
  try {
    if (!(await adminFromRequest())) {
      return NextResponse.json(
        { ok: false, message: "Please sign in again." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    const id = String(body?.id ?? "");
    const status = String(body?.status ?? "");

    if (!UUID.test(id) || !STATUSES.includes(status)) {
      return NextResponse.json(
        { ok: false, message: "Invalid request." },
        { status: 400 },
      );
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("registrations")
      .update({
        status,
        reviewed_at: status === "pending" ? null : new Date().toISOString(),
      })
      .eq("id", id)
      .in("role", ["artist", "visitor"])
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data)
      return NextResponse.json(
        { ok: false, message: "Not found." },
        { status: 404 },
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: "Something went wrong." },
      { status: 500 },
    );
  }
}
