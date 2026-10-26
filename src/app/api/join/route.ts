import { NextResponse } from "next/server";
import { fieldErrors, joinSchema, normalizeInput } from "@/lib/join/schema";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getServiceClient } from "@/lib/supabase/server";
import { siteConfig } from "@/data/site";

export const runtime = "nodejs";

const BUCKET = "proofs";
const ID_BUCKET = "ids";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fail = (
  message: string,
  status: number,
  errors?: Record<string, string>,
) => NextResponse.json({ ok: false, message, errors }, { status });

export async function POST(req: Request) {
  if (siteConfig.joinPaused) {
    return fail(
      "Joining is temporarily unavailable. Come by and we'll take care of it!",
      503,
    );
  }
  try {
    if (!rateLimit(`join:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
      return fail("Too many attempts. Please try again in a few minutes.", 429);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid request.", 400);

    // honeypot: bots fill the hidden field. Pretend it worked, save nothing.
    if (body.website) return NextResponse.json({ ok: true });

    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        "Please check the highlighted fields.",
        422,
        fieldErrors(parsed.error),
      );
    }

    const d = parsed.data;
    const clean = normalizeInput(d);
    const supabase = getServiceClient();

    // artists: make sure the proof files really exist in our storage
    let proofPaths: string[] = [];
    if (d.role === "artist") {
      const uploadId = String(body.uploadId ?? "");
      const prefix = `pending/${uploadId}/`;

      const pathsAreValid =
        UUID.test(uploadId) &&
        d.proofPaths.every(
          (p) => p.startsWith(prefix) && !p.slice(prefix.length).includes("/"),
        );
      if (!pathsAreValid)
        return fail("Your files could not be verified. Please try again.", 400);

      const { data: listed, error } = await supabase.storage
        .from(BUCKET)
        .list(`pending/${uploadId}`);
      if (error) throw error;

      const existing = new Set((listed ?? []).map((f) => `${prefix}${f.name}`));
      if (!d.proofPaths.every((p) => existing.has(p))) {
        return fail(
          "Some files didn't finish uploading. Please try again.",
          400,
        );
      }
      proofPaths = d.proofPaths;
    }

    // national ID: make sure the picture really is in our private storage
    const idUploadId = String(body.idUploadId ?? "");
    const idPrefix = `pending/${idUploadId}/`;
    if (
      !UUID.test(idUploadId) ||
      !d.idPath.startsWith(idPrefix) ||
      d.idPath.slice(idPrefix.length).includes("/")
    ) {
      return fail("Your ID picture could not be verified. Please try again.", 400);
    }
    const { data: idListed, error: idListError } = await supabase.storage
      .from(ID_BUCKET)
      .list(`pending/${idUploadId}`);
    if (idListError) throw idListError;
    if (!(idListed ?? []).some((f) => `${idPrefix}${f.name}` === d.idPath)) {
      return fail("Your ID picture didn't finish uploading. Please try again.", 400);
    }

    // already registered with this number?
    const { data: duplicate } = await supabase
      .from("registrations")
      .select("id")
      .eq("phone", clean.phone)
      .eq("role", d.role)
      .in("status", ["pending", "accepted"])
      .limit(1);

    if (duplicate && duplicate.length > 0) {
      return fail(
        "This WhatsApp number is already registered for this role.",
        409,
        { phone: "Already registered with this number" },
      );
    }

    const { error: insertError } = await supabase.from("registrations").insert({
      role: d.role,
      full_name: clean.fullName,
      stage_name: clean.stageName || null,
      phone: clean.phone,
      email: clean.email || null,
      instagram: clean.instagram || null,
      why: clean.why,
      art_type: d.role === "artist" ? clean.artType : null,
      art_type_other:
        d.role === "artist" && clean.artType === "Other"
          ? clean.artTypeOther
          : null,
      portfolio_url: clean.portfolioUrl || null,
      detail: clean.detail || null,
      proof_paths: proofPaths,
      id_path: d.idPath,
      data_consent_at: new Date().toISOString(),
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return fail(
          "This WhatsApp number is already registered for this role.",
          409,
        );
      }
      throw insertError;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return fail("Something went wrong on our side. Please try again.", 500);
  }
}
