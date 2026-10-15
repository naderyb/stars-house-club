import TablesBoard from "@/components/admin/TablesBoard";
import type {
  AdminOrder,
  AdminTable,
  MenuChoice,
  PaidOrder,
} from "@/lib/admin/orderTypes";
import { getTodayTotal, todayStartIso } from "@/lib/admin/stats";
import { getServiceClient } from "@/lib/supabase/server";

export default async function AdminTablesPage() {
  const supabase = getServiceClient();

  const [tables, open, paid, menuItems, todayTotal] = await Promise.all([
    supabase.from("restaurant_tables").select("id, number").order("number"),
    supabase
      .from("orders")
      .select(
        "id, table_id, table_label, created_at, order_items(id, name, price, qty, created_at)",
      )
      .eq("status", "open"),
    supabase
      .from("orders")
      .select("id, table_id, table_label, total, paid_at")
      .eq("status", "paid")
      .gte("paid_at", todayStartIso())
      .order("paid_at", { ascending: false })
      .limit(20),
    supabase
      .from("menu_items")
      .select("name, price")
      .eq("available", true)
      .order("sort")
      .order("created_at"),
    getTodayTotal(),
  ]);

  if (tables.error) throw tables.error;
  if (open.error) throw open.error;
  if (paid.error) throw paid.error;
  if (menuItems.error) throw menuItems.error;

  const orders: AdminOrder[] = (open.data ?? []).map((o) => ({
    id: o.id as string,
    table_id: o.table_id as string | null,
    table_label: o.table_label as string,
    created_at: o.created_at as string,
    items: [
      ...((o.order_items ?? []) as (AdminOrder["items"][number] & {
        created_at: string;
      })[]),
    ]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(({ id, name, price, qty }) => ({ id, name, price, qty })),
  }));

  // one entry per name, in case the same drink sits in two categories
  const seen = new Set<string>();
  const menu: MenuChoice[] = [];
  for (const m of (menuItems.data ?? []) as MenuChoice[]) {
    const key = m.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    menu.push({ name: m.name, price: m.price });
  }

  return (
    <TablesBoard
      tables={(tables.data ?? []) as AdminTable[]}
      orders={orders}
      paidToday={(paid.data ?? []) as PaidOrder[]}
      menu={menu}
      todayTotal={todayTotal}
    />
  );
}
