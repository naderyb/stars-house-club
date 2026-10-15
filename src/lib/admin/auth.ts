import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { safeEqual, verifyPassword } from "./password";

export const normalizeUsername = (u: string) => u.trim().toLowerCase();

/** The login you hand over before any admin exists. It only works while the
 *  admins table is empty, and it must be replaced on first sign-in. */
export const STARTER = {
  username: process.env.ADMIN_BOOTSTRAP_USER || "stars house",
  password: process.env.ADMIN_BOOTSTRAP_PASSWORD || "stars house",
};

/** Session id used while the starter login is active (no real account yet) */
export const STARTER_ID = "starter";

type LoginResult =
  | { ok: false }
  | { ok: true; adminId: string; pv: number; mustChange: boolean };

// a well-formed hash nobody can match: keeps the timing the same when the username doesn't exist
const DUMMY_HASH = `${"00".repeat(16)}:${"00".repeat(64)}`;

export async function checkLogin(
  username: string,
  password: string,
): Promise<LoginResult> {
  const supabase = getServiceClient();
  const name = normalizeUsername(username);

  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, password_hash, must_change, updated_at")
    .eq("username", name)
    .maybeSingle();
  if (error) throw error;

  if (admin) {
    const ok = await verifyPassword(password, admin.password_hash);
    return ok
      ? {
          ok: true,
          adminId: admin.id,
          pv: new Date(admin.updated_at).getTime(),
          mustChange: admin.must_change,
        }
      : { ok: false };
  }

  // the starter login works only while there are no admin accounts at all
  const { count, error: countError } = await supabase
    .from("admins")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;

  if (count === 0) {
    const userOk = safeEqual(name, normalizeUsername(STARTER.username));
    const passOk = safeEqual(password, STARTER.password);
    return userOk && passOk
      ? { ok: true, adminId: STARTER_ID, pv: 0, mustChange: true }
      : { ok: false };
  }

  await verifyPassword(password, DUMMY_HASH);
  return { ok: false };
}
