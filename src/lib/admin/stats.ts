import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

/* Algiers is UTC+1 all year, so a "day" there is easy to compute. */
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const dayKeyOf = (ms: number) => new Date(ms + HOUR).toISOString().slice(0, 10); // YYYY-MM-DD in Algiers
const startOfDay = (key: string) => new Date(`${key}T00:00:00+01:00`).getTime();

export const todayStartIso = () =>
  new Date(startOfDay(dayKeyOf(Date.now()))).toISOString();

interface PaidRow {
  tab_id: string;
  name: string;
  price: number;
  qty: number;
  paid_at: string;
}

/** Every paid line since a moment. Read in pages of 1000, which is the most
 *  the database sends at once, so busy months are never cut short. */
async function paidItemsSince(sinceIso: string): Promise<PaidRow[]> {
  const supabase = getServiceClient();
  const PAGE = 1000;
  const rows: PaidRow[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("tab_items")
      .select("tab_id, name, price, qty, paid_at")
      .not("paid_at", "is", null)
      .gte("paid_at", sinceIso)
      .order("paid_at")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as PaidRow[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export async function getTodayTotal() {
  const rows = await paidItemsSince(todayStartIso());
  return rows.reduce((sum, r) => sum + r.price * r.qty, 0);
}

export interface DayTotal {
  key: string;
  label: string;
  total: number;
  /** number of tabs that paid something that day */
  orders: number;
}

export interface Stats {
  today: { total: number; orders: number; average: number };
  open: { total: number; tables: number };
  week: DayTotal[];
  month: { total: number; orders: number };
  topItems: { name: string; qty: number; revenue: number }[];
}

const labelFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
});

export async function getStats(): Promise<Stats> {
  const supabase = getServiceClient();

  const todayKey = dayKeyOf(Date.now());
  const todayStart = startOfDay(todayKey);
  const monthStart = startOfDay(`${todayKey.slice(0, 8)}01`);
  const weekKeys = Array.from({ length: 7 }, (_, i) =>
    dayKeyOf(todayStart - (6 - i) * DAY),
  );
  const since = Math.min(monthStart, startOfDay(weekKeys[0]));

  const [paid, unpaid, openTabs] = await Promise.all([
    paidItemsSince(new Date(since).toISOString()),
    // what is still owed (a few hundred lines at most, so one read is enough)
    supabase
      .from("tab_items")
      .select("price, qty")
      .is("paid_at", null)
      .range(0, 4999),
    supabase
      .from("tabs")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);
  if (unpaid.error) throw unpaid.error;
  if (openTabs.error) throw openTabs.error;

  const byDay = new Map<string, { total: number; tabs: Set<string> }>();
  const monthTabs = new Set<string>();
  let monthTotal = 0;
  const items = new Map<
    string,
    { name: string; qty: number; revenue: number }
  >();

  for (const r of paid) {
    const ms = new Date(r.paid_at).getTime();
    const amount = r.price * r.qty;
    const key = dayKeyOf(ms);

    const day = byDay.get(key) ?? { total: 0, tabs: new Set<string>() };
    day.total += amount;
    day.tabs.add(r.tab_id);
    byDay.set(key, day);

    if (ms >= monthStart) {
      monthTotal += amount;
      monthTabs.add(r.tab_id);
    }

    if (ms >= todayStart) {
      const itemKey = r.name.trim().toLowerCase();
      const row = items.get(itemKey) ?? { name: r.name, qty: 0, revenue: 0 };
      row.qty += r.qty;
      row.revenue += amount;
      items.set(itemKey, row);
    }
  }

  const week = weekKeys.map((key) => ({
    key,
    label: labelFmt.format(new Date(`${key}T12:00:00Z`)),
    total: byDay.get(key)?.total ?? 0,
    orders: byDay.get(key)?.tabs.size ?? 0,
  }));
  const today = week[week.length - 1];

  const openTotal = (unpaid.data ?? []).reduce(
    (sum, i) => sum + (i.price as number) * (i.qty as number),
    0,
  );

  return {
    today: {
      total: today.total,
      orders: today.orders,
      average: today.orders ? Math.round(today.total / today.orders) : 0,
    },
    open: { total: openTotal, tables: openTabs.count ?? 0 },
    week,
    month: { total: monthTotal, orders: monthTabs.size },
    topItems: Array.from(items.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8),
  };
}
