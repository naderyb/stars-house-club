import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "shc_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

interface SessionPayload {
  /** true = still on the starter login, must set their own credentials */
  mc: boolean;
  exp: number;
}

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET is missing or shorter than 32 characters",
    );
  }
  return s;
}

const sign = (data: string) =>
  createHmac("sha256", secret()).update(data).digest("base64url");

export function createSessionToken(mustChange: boolean) {
  const payload: SessionPayload = {
    mc: mustChange,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function readSessionToken(token?: string): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as SessionPayload;
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: MAX_AGE,
};

export async function getSession() {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}

/** For pages: sends the visitor to the right place instead of returning */
export async function requireAdminPage(
  options: { allowMustChange?: boolean } = {},
) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.mc && !options.allowMustChange) redirect("/admin/setup");
  return session;
}

/** For API routes: returns null when the request isn't allowed */
export async function adminFromRequest(
  options: { allowMustChange?: boolean } = {},
) {
  const session = await getSession();
  if (!session) return null;
  if (session.mc && !options.allowMustChange) return null;
  return session;
}
