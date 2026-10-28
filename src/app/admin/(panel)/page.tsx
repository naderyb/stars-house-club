import RegistrationsBoard from "@/components/admin/RegistrationsBoard";
import type { AdminRegistration } from "@/lib/admin/types";
import { ACCESS, type Role } from "@/lib/admin/roles";
import { getServiceClient } from "@/lib/supabase/server";
import { requireAdminPage } from "@/lib/admin/session";

export default async function AdminHome() {
  const session = await requireAdminPage({ roles: ACCESS.registrations });
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("registrations")
    .select(
      "id, created_at, role, full_name, stage_name, phone, email, instagram, why, art_type, art_type_other, portfolio_url, proof_paths, status, id_path, banned, ban_reason, reject_reason",
    )
    .in("role", ["artist", "visitor"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  const items = (data ?? []).map(({ proof_paths, id_path, ...rest }) => ({
    ...rest,
    proof_count: (proof_paths ?? []).length,
    has_id: Boolean(id_path),
  })) as AdminRegistration[];

  return (
    <RegistrationsBoard
      initial={items}
      canDecide={session.role === "admin"}
      canViewId={(ACCESS.idView as readonly Role[]).includes(session.role)}
      canErase={(ACCESS.erase as readonly Role[]).includes(session.role)}
      canBan={(ACCESS.ban as readonly Role[]).includes(session.role)}
    />
  );
}
