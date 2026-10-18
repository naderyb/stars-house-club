import RegistrationsBoard from "@/components/admin/RegistrationsBoard";
import type { AdminRegistration } from "@/lib/admin/types";
import { getServiceClient } from "@/lib/supabase/server";
import { ACCESS } from "@/lib/admin/roles";
import { requireAdminPage } from "@/lib/admin/session";

export default async function AdminHome() {
  await requireAdminPage({ roles: ACCESS.registrations });
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("registrations")
    .select(
      "id, created_at, role, full_name, stage_name, phone, email, instagram, why, art_type, art_type_other, portfolio_url, proof_paths, status",
    )
    .in("role", ["artist", "visitor"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  const items = (data ?? []).map(({ proof_paths, ...rest }) => ({
    ...rest,
    proof_count: (proof_paths ?? []).length,
  })) as AdminRegistration[];

  return <RegistrationsBoard initial={items} />;
}
