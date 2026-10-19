import { NextResponse } from "next/server";
import { ACCESS } from "@/lib/admin/roles";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

export async function POST(req: Request) {
  try {
    const session = await adminFromRequest({ roles: ACCESS.ban });
    if (!session) return fail("Your account isn't allowed to ban people.", 403);

    const body = await req.json().catch(() => null);
    const id = String(body?.id ?? "");
    const banned = body?.banned === true;
    const reason =
      typeof body?.reason === "string" ? body.reason.trim().slice(0, 200) : "";

    if (!UUID.test(id) || typeof body?.banned !== "boolean") {
      return fail("Invalid request.", 400);
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("registrations")
      .update(
        banned
          ? {
              banned: true,
              banned_at: new Date().toISOString(),
              ban_reason: reason || null,
              banned_by: session.username,
            }
          : {
              banned: false,
              banned_at: null,
              ban_reason: null,
              banned_by: null,
            },
      )
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return fail("Not found.", 404);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return fail("Something went wrong.", 500);
  }
}
