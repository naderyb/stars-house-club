import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeUsername, STARTER } from "@/lib/admin/auth";
import { hashPassword } from "@/lib/admin/password";
import { adminFromRequest } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";
import { ACCESS, ROLES } from "@/lib/admin/roles";

export const runtime = "nodejs";

const id = z.string().uuid();
const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username: 3 characters minimum.")
  .max(40, "Username: 40 characters maximum.");
const password = z
  .string()
  .min(8, "The temporary password needs 8 characters minimum.")
  .max(100, "Password: 100 characters maximum.");

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), username, password, role: z.enum(ROLES) }),
  z.object({ action: z.literal("reset"), id, password }),
  z.object({ action: z.literal("remove"), id }),
]);

const fail = (message: string, status: number) =>
  NextResponse.json({ ok: false, message }, { status });

export async function POST(req: Request) {
  try {
    const session = await adminFromRequest({ roles: ACCESS.team });    if (!session) return fail("Please sign in again.", 401);

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid request.", 422);
    }

    const body = parsed.data;
    const supabase = getServiceClient();

    switch (body.action) {
      case "add": {
        if (body.username === normalizeUsername(STARTER.username)) {
          return fail("Choose a different username.", 422);
        }
        // must_change = true: they pick their own login the first time they sign in
        const { error } = await supabase.from("admins").insert({
          username: body.username,
          password_hash: await hashPassword(body.password),
          role: body.role,
          must_change: true,
        });
        if (error) {
          if (error.code === "23505")
            return fail("That username is already taken.", 409);
          throw error;
        }
        break;
      }

      case "reset": {
        if (body.id === session.id) {
          return fail('To change your own password, use "My login".', 422);
        }
        // new updated_at = every device still signed in with the old password is logged out
        const { data, error } = await supabase
          .from("admins")
          .update({
            password_hash: await hashPassword(body.password),
            must_change: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", body.id)
          .select("id")
          .maybeSingle();
        if (error) throw error;
        if (!data) return fail("Admin not found.", 404);
        break;
      }

      case "remove": {
        if (body.id === session.id)
          return fail("You can't remove your own account.", 422);

        const { count, error: countError } = await supabase
          .from("admins")
          .select("id", { count: "exact", head: true });
        if (countError) throw countError;
        if ((count ?? 0) <= 1)
          return fail("You can't remove the last admin.", 422);

        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return fail("Something went wrong on our side.", 500);
  }
}
