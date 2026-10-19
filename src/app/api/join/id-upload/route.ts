import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { checkIdMeta, type FileMeta } from "@/lib/join/schema";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "ids";
const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

export async function POST(req: Request) {
  try {
    if (!rateLimit(`id-upload:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
      return fail("Too many attempts. Please try again in a few minutes.", 429);
    }

    const body = await req.json().catch(() => null);
    const file: FileMeta | undefined = body?.file;
    if (
      typeof file?.name !== "string" ||
      typeof file?.type !== "string" ||
      typeof file?.size !== "number"
    ) {
      return fail("Invalid file information.", 400);
    }
    const problem = checkIdMeta(file);
    if (problem) return fail(problem, 400);

    // the file name is never kept: nobody should read a name off the storage
    const uploadId = randomUUID();
    const path = `pending/${uploadId}/id.${EXTENSION[file.type]}`;

    const supabase = getServiceClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) {
      console.error("signed id upload url failed", error);
      return fail("Could not prepare your upload. Please try again.", 500);
    }

    return NextResponse.json({ ok: true, uploadId, path, token: data.token });
  } catch (err) {
    console.error(err);
    return fail("Something went wrong. Please try again.", 500);
  }
}
