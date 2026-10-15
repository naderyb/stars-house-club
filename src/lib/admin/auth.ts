import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { safeEqual, verifyPassword } from "./password";

export const normalizeUsername = (u: string) => u.trim().toLowerCase();

/** The login you hand to the admin. They must replace it on first sign-in. */
export const STARTER = {
  username: process.env.ADMIN_BOOTSTRAP_USER ?? "stars house",
  password: process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "stars house",
};

type LoginResult = { ok: false } | { ok: true; mustChange: boolean };

export async function checkLogin(
  username: string,
  password: string,
): Promise<LoginResult> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("admin_account")
    .select("username, password_hash")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;

  // the admin already chose their own credentials: only those work now
  if (data) {
    const userOk = safeEqual(normalizeUsername(username), data.username);
    const passOk = await verifyPassword(password, data.password_hash);
    return userOk && passOk ? { ok: true, mustChange: false } : { ok: false };
  }

  // first time: the starter login works, and forces a change
  const userOk = safeEqual(
    normalizeUsername(username),
    normalizeUsername(STARTER.username),
  );
  const passOk = safeEqual(password, STARTER.password);
  return userOk && passOk ? { ok: true, mustChange: true } : { ok: false };
}
