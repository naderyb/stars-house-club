import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

/* Algiers is UTC+1 all year, so a "day" there is easy to compute. */
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const dayKeyOf = (ms: number) => new Date(ms + HOUR).toISOString().slice(0, 10); // YYYY-MM-DD in Algiers
const startOfDay = (key: string) => new Date(`${key}T00:00:00+01:00`).getTime();

export const todayStartIso = () =>
  new Date(startOfDay(dayKeyOf(Date.now()))).toISOString();

export async function getTodayTotal() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("total")
    .eq("status", "paid")
    .gte("paid_at", todayStartIso());
  if (error) throw error;
  return (data ?? []).reduce((sum, o) => sum + (o.total as number), 0);
}

export interface DayTotal {
  key: string;
  label: string;
  total: number;
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

  const [paid, todayItems, open] = await Promise.all([
    supabase
      .from("orders")
      .select("total, paid_at")
      .eq("status", "paid")
      .gte("paid_at", new Date(since).toISOString())
      .limit(5000),
    supabase
      .from("orders")
      .select("order_items(name, price, qty)")
      .eq("status", "paid")
      .gte("paid_at", new Date(todayStart).toISOString()),
    supabase
      .from("orders")
      .select("order_items(price, qty)")
      .eq("status", "open"),
  ]);
  if (paid.error) throw paid.error;
  if (todayItems.error) throw todayItems.error;
  if (open.error) throw open.error;

  const byDay = new Map<string, { total: number; orders: number }>();
  let monthTotal = 0;
  let monthOrders = 0;
  for (const o of paid.data ?? []) {
    const ms = new Date(o.paid_at as string).getTime();
    const key = dayKeyOf(ms);
    const day = byDay.get(key) ?? { total: 0, orders: 0 };
    day.total += o.total as number;
    day.orders += 1;
    byDay.set(key, day);
    if (ms >= monthStart) {
      monthTotal += o.total as number;
      monthOrders += 1;
    }
  }

  const week = weekKeys.map((key) => ({
    key,
    label: labelFmt.format(new Date(`${key}T12:00:00Z`)),
    total: byDay.get(key)?.total ?? 0,
    orders: byDay.get(key)?.orders ?? 0,
  }));
  const today = week[week.length - 1];

  const items = new Map<
    string,
    { name: string; qty: number; revenue: number }
  >();
  for (const order of todayItems.data ?? []) {
    for (const i of (order.order_items ?? []) as {
      name: string;
      price: number;
      qty: number;
    }[]) {
      const key = i.name.trim().toLowerCase();
      const row = items.get(key) ?? { name: i.name, qty: 0, revenue: 0 };
      row.qty += i.qty;
      row.revenue += i.qty * i.price;
      items.set(key, row);
    }
  }

  let openTotal = 0;
  for (const o of open.data ?? []) {
    for (const i of (o.order_items ?? []) as { price: number; qty: number }[]) {
      openTotal += i.price * i.qty;
    }
  }

  return {
    today: {
      total: today.total,
      orders: today.orders,
      average: today.orders ? Math.round(today.total / today.orders) : 0,
    },
    open: { total: openTotal, tables: (open.data ?? []).length },
    week,
    month: { total: monthTotal, orders: monthOrders },
    topItems: Array.from(items.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8),
  };
}
