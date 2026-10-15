import { NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  try {
    if (!(await adminFromRequest())) {
      return NextResponse.json({ ok: false, message: "Please sign in again." }, { status: 401 });
    }

    const id = new URL(req.url).searchParams.get("id") ?? "";
    if (!UUID.test(id)) return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });

    const supabase = getServiceClient();
    const { data: row, error } = await supabase
      .from("registrations")
      .select("proof_paths")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;

    const paths: string[] = row?.proof_paths ?? [];
    if (paths.length === 0) return NextResponse.json({ ok: true, files: [] });

    const { data: signed, error: signError } = await supabase.storage
      .from("proofs")
      .createSignedUrls(paths, 60 * 60);
    if (signError) throw signError;

    const files = (signed ?? [])
      .filter((s) => s.signedUrl)
      .map((s) => ({
        url: s.signedUrl,
        kind: /\.(mp4|mov|webm)$/i.test(s.path ?? "") ? "video" : "image",
      }));

    return NextResponse.json({ ok: true, files });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "Something went wrong." }, { status: 500 });
  }
}