import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type { MenuChoice } from "./orderTypes";
import { todayStartIso } from "./stats";
import type { ClosedTab, Tab, TabItem } from "./tabTypes";

/** Calls the SQL cleanup: yesterday's tabs lose their names (sales stay). */
export async function wipeOldTabs() {
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
    items: [...((t.tab_items ?? []) as (TabItem & { created_at: string })[])]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(({ id, name, price, qty, paid_at }) => ({
        id,
        name,
        price,
        qty,
        paid_at,
      })),
  }));
}

/** The menu as quick-pick choices: one entry per name, available items only. */
export async function getMenuChoices(): Promise<MenuChoice[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("name, price")
    .eq("available", true)
    .order("sort")
    .order("created_at");
  if (error) throw error;

  const seen = new Set<string>();
  const menu: MenuChoice[] = [];
  for (const m of (data ?? []) as MenuChoice[]) {
    const key = m.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    menu.push({ name: m.name, price: m.price });
  }
  return menu;
}

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
