import "server-only";
import { unstable_cache } from "next/cache";
import { getServiceClient } from "@/lib/supabase/server";
import type { MenuChoice } from "./orderTypes";
import { todayStartIso } from "./stats";
import type { ClosedTab, Tab, TabItem } from "./tabTypes";

let lastWipe = 0;

/** Calls the SQL cleanup: yesterday's tabs lose their names (sales stay).
 *  Runs at most once every 10 minutes, not on every screen refresh. */
export async function wipeOldTabs() {
  if (Date.now() - lastWipe < 10 * 60 * 1000) return;
  lastWipe = Date.now();
  const supabase = getServiceClient();
  const { error } = await supabase.rpc("wipe_old_tabs");
  if (error) console.error("wipe_old_tabs failed:", error.message);
}

/** Every tab that is still open, oldest first, with its items. */
export async function getOpenTabs(): Promise<Tab[]> {
  await wipeOldTabs();

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("tabs")
    .select(
      "id, name, created_at, created_by, tab_items(id, name, price, qty, paid_at, created_at)",
    )
    .eq("status", "open")
    .order("created_at");
  if (error) throw error;

  return (data ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    created_at: t.created_at as string,
    created_by: t.created_by as string | null,
    items: [...((t.tab_items ?? []) as TabItem[])]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(({ id, name, price, qty, paid_at, created_at }) => ({
        id,
        name,
        price,
        qty,
        paid_at,
        created_at,
      })),
  }));
}

/** The menu as quick-pick choices, in the menu's own order, grouped by section.
 *  Available items only, one entry per name. */
async function loadMenuChoices(): Promise<MenuChoice[]> {
  const supabase = getServiceClient();
  const [cats, items] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, title")
      .order("sort")
      .order("created_at"),
    supabase
      .from("menu_items")
      .select("category_id, name, price")
      .eq("available", true)
      .order("sort")
      .order("created_at"),
  ]);
  if (cats.error) throw cats.error;
  if (items.error) throw items.error;

  const seen = new Set<string>();
  const menu: MenuChoice[] = [];
  for (const cat of cats.data ?? []) {
    for (const m of items.data ?? []) {
      if (m.category_id !== cat.id) continue;
      const key = (m.name as string).trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      menu.push({
        name: m.name as string,
        price: m.price as number,
        section: cat.title as string,
      });
    }
  }
  return menu;
}

/** The menu rarely changes, so every screen shares one copy for 30 seconds. */
export const getMenuChoices = unstable_cache(
  loadMenuChoices,
  ["admin-menu-choices"],
  { revalidate: 30 },
);

/** Tabs settled today, newest first (so an admin can undo a mistake). */
export async function getRecentlyClosedTabs(): Promise<ClosedTab[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("tabs")
    .select("id, name, closed_at, tab_items(price, qty)")
    .eq("status", "closed")
    .gte("closed_at", todayStartIso())
    .order("closed_at", { ascending: false })
    .limit(20);
  if (error) throw error;

  return (data ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    closed_at: t.closed_at as string,
    total: ((t.tab_items ?? []) as { price: number; qty: number }[]).reduce(
      (sum, i) => sum + i.price * i.qty,
      0,
    ),
  }));
}
