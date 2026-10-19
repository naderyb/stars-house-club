import { NextResponse } from "next/server";
import { ACCESS } from "@/lib/admin/roles";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: Request) {
  try {
    if (!(await adminFromRequest({ roles: ACCESS.idView }))) {
      return reply(
        { ok: false, message: "You're not allowed to open IDs." },
        403,
      );
    }

    const id = new URL(req.url).searchParams.get("id") ?? "";
    if (!UUID.test(id))
      return reply({ ok: false, message: "Invalid request." }, 400);

    const supabase = getServiceClient();
    const { data: row, error } = await supabase
      .from("registrations")
      .select("id_path")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;

    if (!row?.id_path) {
      return reply(
        {
          ok: false,
          message:
            "No ID on file (older registration, or deleted by an admin).",
        },
        404,
      );
    }

    // the link dies after 2 minutes: long enough to look, too short to share
    const { data: signed, error: signError } = await supabase.storage
      .from("ids")
      .createSignedUrl(row.id_path, 120);
    if (signError || !signed) throw signError ?? new Error("no signed url");

    return reply({ ok: true, url: signed.signedUrl });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, message: "Something went wrong." }, 500);
  }
}
