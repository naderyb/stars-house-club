import TeamManager, { type TeamAdmin } from "@/components/admin/TeamManager";
import { getServiceClient } from "@/lib/supabase/server";
import { ACCESS } from "@/lib/admin/roles";
import { requireAdminPage } from "@/lib/admin/session";

export default async function AdminTeamPage() {
  const session = await requireAdminPage({ roles: ACCESS.team });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id, username, role, must_change, created_at")
    .order("created_at");
  if (error) throw error;

  return <TeamManager admins={(data ?? []) as TeamAdmin[]} meId={session.id} />;
}
