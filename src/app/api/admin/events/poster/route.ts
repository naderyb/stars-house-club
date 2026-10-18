import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";
import { ACCESS } from "@/lib/admin/roles";

export const runtime = "nodejs";

const BUCKET = "event-posters";
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

export async function POST(req: Request) {
  try {
    if (!(await adminFromRequest({ roles: ACCESS.events })))
      return fail("Please sign in again.", 401);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return fail("Choose an image first.", 400);

    const ext = TYPES[file.type];
    if (!ext) return fail("Use a JPG, PNG or WebP image.", 422);
    if (file.size > MAX_SIZE) return fail("The image is over 4 MB.", 422);

    const supabase = getServiceClient();
    const path = `${randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        cacheControl: "31536000",
      });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ ok: true, url: data.publicUrl });
  } catch (err) {
    console.error(err);
    return fail("Could not upload the image.", 500);
  }
}
