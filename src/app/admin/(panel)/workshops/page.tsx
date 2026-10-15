import WorkshopManager from "@/components/admin/WorkshopManager";
import type {
  AdminWorkshop,
  AdminWorkshopOption,
} from "@/lib/admin/workshopTypes";
import { getServiceClient } from "@/lib/supabase/server";

export default async function AdminWorkshopsPage() {
  const supabase = getServiceClient();

  const [ws, opts] = await Promise.all([
    supabase
      .from("workshops")
      .select("id, title, title_ar, blurb, materials, active, sort")
      .order("sort")
      .order("created_at"),
    supabase
      .from("workshop_options")
      .select("id, workshop_id, name, note, price, add_on, sort")
      .order("sort"),
  ]);

  if (ws.error) throw ws.error;
  if (opts.error) throw opts.error;

  return (
    <WorkshopManager
      workshops={(ws.data ?? []) as AdminWorkshop[]}
      options={(opts.data ?? []) as AdminWorkshopOption[]}
    />
  );
}
