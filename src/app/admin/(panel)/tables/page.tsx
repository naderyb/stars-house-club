import TabsBoard from "@/components/admin/TabsBoard";
import { ACCESS, CAN, type Role } from "@/lib/admin/roles";
import { requireAdminPage } from "@/lib/admin/session";
import { getTodayTotal } from "@/lib/admin/stats";
import {
  getMenuChoices,
  getOpenTabs,
  getRecentlyClosedTabs,
} from "@/lib/admin/tabs";

export default async function AdminOrdersPage() {
  const session = await requireAdminPage({ roles: ACCESS.orders });

  const isAdmin = session.role === "admin";
  const canTake = (CAN.takeOrders as readonly Role[]).includes(session.role);

  // money figures are only fetched for admins: the cashier and waiter never receive them
  const [tabs, menu, recentlyPaid, todayTotal] = await Promise.all([
    getOpenTabs(),
    canTake ? getMenuChoices() : Promise.resolve([]),
    isAdmin ? getRecentlyClosedTabs() : Promise.resolve([]),
    isAdmin ? getTodayTotal() : Promise.resolve(null),
  ]);

  return (
    <TabsBoard
      tabs={tabs}
      menu={menu}
      role={session.role}
      recentlyPaid={recentlyPaid}
      todayTotal={todayTotal}
    />
  );
}
