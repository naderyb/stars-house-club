import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { checkProofMeta, MAX_PROOFS, type FileMeta } from "@/lib/join/schema";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "proofs";

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

const safeName = (name: string) =>
  name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-60);

export async function POST(req: Request) {
  try {
    if (!rateLimit(`upload:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
      return fail("Too many attempts. Please try again in a few minutes.", 429);
    }

    const body = await req.json().catch(() => null);
    const files: FileMeta[] = body?.files;

    if (
      !Array.isArray(files) ||
      files.length < 1 ||
      files.length > MAX_PROOFS
    ) {
      return fail(`Add between 1 and ${MAX_PROOFS} files.`, 400);
    }

    for (const f of files) {
      if (
        typeof f?.name !== "string" ||
        typeof f?.type !== "string" ||
        typeof f?.size !== "number"
      ) {
        return fail("Invalid file information.", 400);
      }
      const problem = checkProofMeta(f);
      if (problem) return fail(problem, 400);
    }

    const supabase = getServiceClient();
    const uploadId = randomUUID();
    const slots: { path: string; token: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const path = `pending/${uploadId}/${i + 1}-${safeName(files[i].name)}`;
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);
      if (error || !data) {
        console.error("signed upload url failed", error);
        return fail("Could not prepare your upload. Please try again.", 500);
      }
      slots.push({ path, token: data.token });
    }

    return NextResponse.json({ ok: true, uploadId, files: slots });
  } catch (err) {
    console.error(err);
    return fail("Something went wrong. Please try again.", 500);
  }
}
