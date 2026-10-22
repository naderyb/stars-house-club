import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServiceClient } from "@/lib/supabase/server";
import { STARTER_ID } from "./auth";
import { roleHome, type Role } from "./roles";

export const SESSION_COOKIE = "shc_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10; // 10 years; logout is explicit

interface TokenPayload {
  /** admin id, or "starter" while no account exists yet */
  aid: string;
  /** password version: changes whenever the password is changed or reset,
   *  which logs out every device that still has the old one */
  pv: number;
}

export interface AdminSession {
  id: string;
  username: string;
  role: Role;
  /** true = must choose their own username and password before anything else */
  mc: boolean;
}

interface GuardOptions {
  allowMustChange?: boolean;
  /** who may pass. Leave out = any signed-in account */
  roles?: readonly Role[];
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

export function createSessionToken(adminId: string, passwordVersion: number) {
  const payload: TokenPayload = {
    aid: adminId,
    pv: passwordVersion,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function readSessionToken(token?: string): TokenPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as TokenPayload;
    const valid =
      typeof payload.aid === "string" &&
      typeof payload.pv === "number";
    return valid ? payload : null;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

/** Reads the cookie AND checks the account still exists and the password
 *  hasn't changed since. Removed or reset accounts are out on their next click. */
export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!token) return null;

  try {
    const supabase = getServiceClient();

    if (token.aid === STARTER_ID) {
      // the starter session is only valid while nobody has an account
      const { count, error } = await supabase
        .from("admins")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count === 0
        ? { id: STARTER_ID, username: "starter", role: "admin", mc: true }
        : null;
    }

    const { data, error } = await supabase
      .from("admins")
      .select("id, username, role, must_change, updated_at")
      .eq("id", token.aid)
      .maybeSingle();
    if (error) throw error;
    if (!data || new Date(data.updated_at).getTime() !== token.pv) return null;

    return {
      id: data.id,
      username: data.username,
      role: data.role as Role,
      mc: data.must_change,
    };
  } catch (err) {
    console.error("admin session check failed", err);
    return null;
  }
}

/** For pages: sends the visitor to the right place instead of returning */
export async function requireAdminPage(options: GuardOptions = {}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.mc && !options.allowMustChange) redirect("/admin/setup");
  // wrong role: send them home instead of showing an error
  if (options.roles && !options.roles.includes(session.role)) {
    redirect(roleHome[session.role]);
  }
  return session;
}

/** For API routes: returns null when the request isn't allowed */
export async function adminFromRequest(options: GuardOptions = {}) {
  const session = await getSession();
  if (!session) return null;
  if (session.mc && !options.allowMustChange) return null;
  if (options.roles && !options.roles.includes(session.role)) return null;
  return session;
}
