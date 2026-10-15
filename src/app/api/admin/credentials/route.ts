import { NextResponse } from "next/server";
import { normalizeUsername, STARTER, STARTER_ID } from "@/lib/admin/auth";
import { hashPassword } from "@/lib/admin/password";
import {
  adminFromRequest,
  cookieOptions,
  createSessionToken,
  SESSION_COOKIE,
} from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const json = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, { status });

export async function POST(req: Request) {
  try {
    const session = await adminFromRequest({ allowMustChange: true });
    if (!session)
      return json({ ok: false, message: "Please sign in again." }, 401);

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

    if (Object.keys(errors).length > 0) return json({ ok: false, errors }, 422);

    const supabase = getServiceClient();
    const stamp = new Date();
    const values = {
      username,
      password_hash: await hashPassword(password),
      must_change: false,
      updated_at: stamp.toISOString(),
    };

    let adminId = session.id;

    if (session.id === STARTER_ID) {
      // very first account: only allowed while nobody has one
      const { count, error: countError } = await supabase
        .from("admins")
        .select("id", { count: "exact", head: true });
      if (countError) throw countError;
      if (count !== 0) {
        return json(
          {
            ok: false,
            message: "An admin account already exists. Please sign in with it.",
          },
          409,
        );
      }

      const { data, error } = await supabase
        .from("admins")
        .insert(values)
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505") {
          return json(
            { ok: false, errors: { username: "That username is taken." } },
            422,
          );
        }
        throw error;
      }
      adminId = data.id;
    } else {
      const { error } = await supabase
        .from("admins")
        .update(values)
        .eq("id", session.id);
      if (error) {
        if (error.code === "23505") {
          return json(
            { ok: false, errors: { username: "That username is taken." } },
            422,
          );
        }
        throw error;
      }
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(
      SESSION_COOKIE,
      createSessionToken(adminId, stamp.getTime()),
      cookieOptions,
    );
    return res;
  } catch (err) {
    console.error(err);
    return json(
      { ok: false, message: "Something went wrong on our side." },
      500,
    );
  }
}
