import EventManager from "@/components/admin/EventManager";
import type { AdminEvent } from "@/lib/admin/eventTypes";
import { getServiceClient } from "@/lib/supabase/server";

const pageLoadedAt = Date.now();

export default async function AdminEventsPage() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, start_at, end_at, category, description, price, image, link, announce",
    )
    .order("start_at", { ascending: false });

  if (error) throw error;

  return (
    <EventManager events={(data ?? []) as AdminEvent[]} now={pageLoadedAt} />
  );
}
