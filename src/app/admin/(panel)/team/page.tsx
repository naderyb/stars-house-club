import TeamManager, { type TeamAdmin } from "@/components/admin/TeamManager";
import { requireAdminPage } from "@/lib/admin/session";
import { getServiceClient } from "@/lib/supabase/server";

export default async function AdminTeamPage() {
  const session = await requireAdminPage();

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id, username, must_change, created_at")
    .order("created_at");
  if (error) throw error;

  return <TeamManager admins={(data ?? []) as TeamAdmin[]} meId={session.id} />;
}
