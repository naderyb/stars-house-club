import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Full-access client. Only ever used in API routes and server code. */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("Supabase environment variables are missing");
  return createClient(url, key, { auth: { persistSession: false } });
}
