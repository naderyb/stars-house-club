import "server-only";
import {
  menuSections as fallback,
  type MenuGroup,
  type MenuSection,
} from "@/data/menu";
import { getServiceClient } from "@/lib/supabase/server";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";

/** Menu as customers see it: only items that are available */
export async function getPublicMenu(): Promise<MenuSection[]> {
  try {
    const supabase = getServiceClient();

    const [cats, items] = await Promise.all([
      supabase
        .from("menu_categories")
        .select("id, title, badge, wide")
        .order("sort")
        .order("created_at"),
      supabase
        .from("menu_items")
        .select("category_id, group_label, name, note, price")
        .eq("available", true)
        .order("sort")
        .order("created_at"),
    ]);
    if (cats.error) throw cats.error;
    if (items.error) throw items.error;

    const usedIds = new Set<string>();

    return (cats.data ?? [])
      .map((cat) => {
        const groups = new Map<string, MenuGroup>();
        for (const item of (items.data ?? []).filter(
          (i) => i.category_id === cat.id,
        )) {
          const key = item.group_label ?? "";
          if (!groups.has(key)) {
            groups.set(key, {
              title: item.group_label ?? undefined,
              items: [],
            });
          }
          groups.get(key)!.items.push({
            name: item.name,
            price: item.price,
            note: item.note ?? undefined,
          });
        }

        let id = slugify(cat.title);
        while (usedIds.has(id)) id += "-2";
        usedIds.add(id);

        return {
          id,
          title: cat.title,
          badge: cat.badge ?? undefined,
          wide: cat.wide,
          groups: Array.from(groups.values()),
        };
      })
      .filter((section) => section.groups.length > 0);
  } catch (err) {
    console.error("menu: database unavailable, using the static list", err);
    return fallback;
  }
}
