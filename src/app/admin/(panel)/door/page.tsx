import DoorList from "@/components/admin/DoorList";
import { ACCESS, type Role } from "@/lib/admin/roles";
import { requireAdminPage } from "@/lib/admin/session";
import type { DoorPerson } from "@/lib/admin/types";
import { getServiceClient } from "@/lib/supabase/server";

export default async function DoorPage() {
  const session = await requireAdminPage({ roles: ACCESS.door });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("registrations")
    .select(
      "id, full_name, stage_name, role, status, phone, email, instagram, banned, ban_reason, id_path",
    )
    .in("role", ["artist", "visitor"])
    .order("full_name", { ascending: true });

  if (error) throw error;

  const people = (data ?? []).map(({ id_path, ...rest }) => ({
    ...rest,
    has_id: Boolean(id_path),
  })) as DoorPerson[];

  return (
    <DoorList
      people={people}
      canBan={(ACCESS.ban as readonly Role[]).includes(session.role)}
    />
  );
}
