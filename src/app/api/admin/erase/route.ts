import { NextResponse } from "next/server";
import { ACCESS } from "@/lib/admin/roles";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

/** Deletes the national ID picture of one person. Their registration stays. */
export async function POST(req: Request) {
  try {
    if (!(await adminFromRequest({ roles: ACCESS.erase }))) {
      return fail("Only an admin can delete an ID.", 403);
    }

    const body = await req.json().catch(() => null);
    const id = String(body?.id ?? "");
    if (!UUID.test(id)) return fail("Invalid request.", 400);

    const supabase = getServiceClient();
    const { data: row, error } = await supabase
      .from("registrations")
      .select("id, id_path")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!row) return fail("Not found.", 404);
    if (!row.id_path) return fail("There is no ID on file for this person.", 409);

    // the file first: if it fails we keep the path, so you can retry
    const { error: removeError } = await supabase.storage
      .from("ids")
      .remove([row.id_path as string]);
    if (removeError) throw removeError;

    const { error: updateError } = await supabase
      .from("registrations")
      .update({ id_path: null })
      .eq("id", id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return fail("Something went wrong.", 500);
  }
}
