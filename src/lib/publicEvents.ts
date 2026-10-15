import "server-only";
import type { ClubEvent } from "@/data/events";
import { getServiceClient } from "@/lib/supabase/server";

/** Events as customers see them (all of them, the pages split upcoming / past) */
export async function getPublicEvents(): Promise<ClubEvent[]> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, start_at, end_at, category, description, price, image, link, announce",
      )
      .order("start_at");
    if (error) throw error;

    return (data ?? []).map((e) => ({
      id: e.id as string,
      title: e.title as string,
      start: new Date(e.start_at as string).toISOString(),
      end: e.end_at ? new Date(e.end_at as string).toISOString() : undefined,
      category: e.category as string,
      description: e.description as string,
      price: (e.price as string | null) ?? undefined,
      image: (e.image as string | null) ?? undefined,
      link: (e.link as string | null) ?? undefined,
      announce: e.announce === false ? false : undefined,
    }));
  } catch (err) {
    console.error("events: database unavailable", err);
    return [];
  }
}
