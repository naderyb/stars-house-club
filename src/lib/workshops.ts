import "server-only";
import { workshops as fallback, type Workshop } from "@/data/workshops";
import { getServiceClient } from "@/lib/supabase/server";

/** Workshops as customers see them: only the ones that are visible */
export async function getPublicWorkshops(): Promise<Workshop[]> {
  try {
    const supabase = getServiceClient();

    const [ws, opts] = await Promise.all([
      supabase
        .from("workshops")
        .select("id, title, title_ar, blurb, materials")
        .eq("active", true)
        .order("sort")
        .order("created_at"),
      supabase
        .from("workshop_options")
        .select("id, workshop_id, name, note, price, add_on")
        .order("sort"),
    ]);
    if (ws.error) throw ws.error;
    if (opts.error) throw opts.error;

    return (ws.data ?? [])
      .map((w) => ({
        id: w.id as string,
        title: w.title as string,
        ar: (w.title_ar as string | null) ?? undefined,
        blurb: w.blurb as string,
        materials: (w.materials as string | null) ?? undefined,
        options: (opts.data ?? [])
          .filter((o) => o.workshop_id === w.id)
          .map((o) => ({
            id: o.id as string,
            name: o.name as string,
            note: (o.note as string | null) ?? undefined,
            price: o.price as number,
            addOn: (o.add_on as boolean) || undefined,
          })),
      }))
      .filter((w) => w.options.length > 0);
  } catch (err) {
    console.error(
      "workshops: database unavailable, using the static list",
      err,
    );
    return fallback;
  }
}
