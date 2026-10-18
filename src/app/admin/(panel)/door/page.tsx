import DoorList from "@/components/admin/DoorList";
import type { DoorPerson } from "@/lib/admin/types";
import { getServiceClient } from "@/lib/supabase/server";
import { ACCESS } from "@/lib/admin/roles";
import { requireAdminPage } from "@/lib/admin/session";

export default async function DoorPage() {
  await requireAdminPage({ roles: ACCESS.door });
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("id, full_name, stage_name, role, status, phone, email, instagram")
    .in("role", ["artist", "visitor"])
    .order("full_name", { ascending: true });

  if (error) throw error;

  return <DoorList people={(data ?? []) as DoorPerson[]} />;
}
