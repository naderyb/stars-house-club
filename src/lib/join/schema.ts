import { z } from "zod";
import { artTypes, getRole, roleIds } from "@/data/join";

export const MIN_WHY_CHARS = 80;
export const MIN_WHY_WORDS = 15;
export const MAX_WHY_CHARS = 1500;
export const MAX_PROOFS = 3;
export const MAX_IMAGE_MB = 8;
export const MAX_VIDEO_MB = 50;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const PROOF_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];

const MB = 1024 * 1024;

export const ID_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_ID_MB = 8;

/** Returns an error message, or null when the ID picture is fine */
export function checkIdMeta(file: FileMeta): string | null {
  if (!ID_TYPES.includes(file.type)) return "Please use a JPG, PNG or WebP picture.";
  if (file.size === 0) return "The picture is empty.";
  if (file.size > MAX_ID_MB * MB) return `The picture is too big (max ${MAX_ID_MB} MB).`;
  return null;
}

export const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

/** Algerian mobile numbers only. Returns +213XXXXXXXXX or null */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s().-]/g, "");
  const match = digits.match(/^(?:\+213|00213|0)([567]\d{8})$/);
  return match ? `+213${match[1]}` : null;
}

/** "@name", "name" or a full instagram link, all become "name" */
export function cleanInstagram(input: string) {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
}

/** "" if empty, a full https link if valid, null if it isn't a link */
export function normalizeUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return "";
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    return url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}

export interface FileMeta {
  name: string;
  type: string;
  size: number;
}

/** Returns an error message, or null when the file is fine */
export function checkProofMeta(file: FileMeta): string | null {
  if (!PROOF_TYPES.includes(file.type)) {
    return `${file.name}: only JPG, PNG, WebP, MP4, MOV or WebM files`;
  }
  const isVideo = VIDEO_TYPES.includes(file.type);
  const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  if (file.size === 0) return `${file.name}: the file is empty`;
  if (file.size > maxMb * MB) {
    return `${file.name}: too big (max ${maxMb} MB for ${isVideo ? "videos" : "pictures"})`;
  }
  return null;
}

export const joinSchema = z
  .object({
    role: z.enum(roleIds),
    fullName: z.string(),
    stageName: z.string(),
    phone: z.string(),
    email: z.string(),
    instagram: z.string(),
    why: z.string(),
    artType: z.string(),
    artTypeOther: z.string(),
    portfolioUrl: z.string(),
    detail: z.string(),
    consent: z.boolean(),
    proofPaths: z.array(z.string()),
    idPath: z.string(),
    dataConsent: z.boolean(),
  })
  .superRefine((d, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    const role = getRole(d.role);

    // name: real first + last name, because the admin verifies it
    const name = d.fullName.trim();
    if (name.length < 4 || countWords(name) < 2 || name.length > 80) {
      add("fullName", "Write your real first and last name. We verify it.");
    }
    if (d.stageName.trim().length > 60)
      add("stageName", "That's a bit long (60 characters max)");

    if (!normalizePhone(d.phone)) {
      add("phone", "Enter a valid Algerian mobile number (05, 06 or 07...)");
    }
    const email = d.email.trim();
    if (
      email &&
      (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    ) {
      add("email", "Enter a valid email address");
    }

    const insta = cleanInstagram(d.instagram);
    if (insta && !/^[A-Za-z0-9._]{1,30}$/.test(insta)) {
      add("instagram", "Enter your handle, like starshouseclub");
    }

    // the "why": one word is not enough
    const why = d.why.trim();
    if (why.length < MIN_WHY_CHARS || countWords(why) < MIN_WHY_WORDS) {
      add(
        "why",
        `Tell us a bit more, at least ${MIN_WHY_WORDS} words. One word isn't enough!`,
      );
    } else if (why.length > MAX_WHY_CHARS) {
      add("why", `Too long (${MAX_WHY_CHARS} characters max)`);
    }

    if (d.role === "artist") {
      if (!d.artType) add("artType", "Pick the type of art you do");
      else if (!artTypes.includes(d.artType))
        add("artType", "Pick one from the list");
      if (d.artType === "Other" && d.artTypeOther.trim().length < 3) {
        add("artTypeOther", "Tell us what kind of art you do");
      }
      if (d.proofPaths.length < 1) {
        add("proofs", "Add at least one picture or video of your art");
      } else if (d.proofPaths.length > MAX_PROOFS) {
        add("proofs", `Maximum ${MAX_PROOFS} files`);
      }
    }

    if (role?.detailRequired && d.detail.trim().length < 15) {
      add("detail", "Tell us a bit more");
    }
    if (d.detail.length > 1000) add("detail", "Too long (1000 characters max)");

    const link = normalizeUrl(d.portfolioUrl);
    if (link === null) add("portfolioUrl", "That doesn't look like a link");
    else if (role?.portfolioRequired && !link)
      add("portfolioUrl", "Add a link to your work");

    if (!d.consent) add("consent", "Please tick this box to continue");
    if (!d.idPath) add("idCard", "Add a picture of your national ID to continue");
    if (!d.dataConsent) add("dataConsent", "Please tick this box to continue");
  });

export type JoinInput = z.infer<typeof joinSchema>;

/** One message per field, the first one wins */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Clean values, ready for the database. Call it after the schema passed */
export function normalizeInput(d: JoinInput) {
  return {
    fullName: d.fullName.trim().replace(/\s+/g, " "),
    stageName: d.stageName.trim(),
    phone: normalizePhone(d.phone) as string,
    email: d.email.trim().toLowerCase(),
    instagram: cleanInstagram(d.instagram),
    why: d.why.trim(),
    artType: d.artType,
    artTypeOther: d.artTypeOther.trim(),
    portfolioUrl: normalizeUrl(d.portfolioUrl) ?? "",
    detail: d.detail.trim(),
  };
}
