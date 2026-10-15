import { NextResponse } from "next/server";
import { normalizeUsername, STARTER } from "@/lib/admin/auth";
import { hashPassword } from "@/lib/admin/password";
import {
  adminFromRequest,
  cookieOptions,
  createSessionToken,
  SESSION_COOKIE,
} from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await adminFromRequest({ allowMustChange: true });
    if (!session)
      return NextResponse.json(
        { ok: false, message: "Please sign in again." },
        { status: 401 },
      );

    const body = await req.json().catch(() => null);
    const username = normalizeUsername(
      typeof body?.username === "string" ? body.username : "",
    );
    const password = typeof body?.password === "string" ? body.password : "";
    const confirm = typeof body?.confirm === "string" ? body.confirm : "";

    const errors: Record<string, string> = {};

    if (username.length < 3 || username.length > 40) {
      errors.username = "Between 3 and 40 characters.";
    } else if (username === normalizeUsername(STARTER.username)) {
      errors.username = "Choose a username different from the starter one.";
    }

    if (password.length < 10) errors.password = "At least 10 characters.";
    else if (password.length > 100) errors.password = "100 characters maximum.";
    else if (
      password === STARTER.password ||
      password.toLowerCase() === username
    ) {
      errors.password =
        "Choose a stronger password, not the starter one or your username.";
    }

    if (password !== confirm) errors.confirm = "The two passwords don't match.";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 422 });
    }

    const supabase = getServiceClient();
    const { error } = await supabase.from("admin_account").upsert({
      id: 1,
      username,
      password_hash: await hashPassword(password),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, createSessionToken(false), cookieOptions);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: "Something went wrong on our side." },
      { status: 500 },
    );
  }
}
