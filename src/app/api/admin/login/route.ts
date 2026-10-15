import { NextResponse } from "next/server";
import { checkLogin } from "@/lib/admin/auth";
import {
  cookieOptions,
  createSessionToken,
  SESSION_COOKIE,
} from "@/lib/admin/session";
import { clientIp, isLimited, recordHit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

export async function POST(req: Request) {
  try {
    const key = `admin-login:${clientIp(req)}`;
    if (isLimited(key, 5, 15 * 60 * 1000)) {
      return fail("Too many wrong tries. Please wait 15 minutes.", 429);
    }

    const body = await req.json().catch(() => null);
    const username =
      typeof body?.username === "string" ? body.username.slice(0, 200) : "";
    const password =
      typeof body?.password === "string" ? body.password.slice(0, 200) : "";

    const result = await checkLogin(username, password);
    if (!result.ok) {
      recordHit(key); // only wrong tries count
      return fail("Wrong username or password.", 401);
    }

    const res = NextResponse.json({ ok: true, mustChange: result.mustChange });
    res.cookies.set(
      SESSION_COOKIE,
      createSessionToken(result.mustChange),
      cookieOptions,
    );
    return res;
  } catch (err) {
    console.error(err);
    return fail("Something went wrong on our side.", 500);
  }
}
