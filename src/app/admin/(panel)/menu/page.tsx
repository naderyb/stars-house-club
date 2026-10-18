import MenuManager from "@/components/admin/MenuManager";
import type { AdminCategory, AdminMenuItem } from "@/lib/admin/menuTypes";
import { getServiceClient } from "@/lib/supabase/server";
import { ACCESS } from "@/lib/admin/roles";
import { requireAdminPage } from "@/lib/admin/session";

export default async function AdminMenuPage() {
  await requireAdminPage({ roles: ACCESS.menu });
  
  const supabase = getServiceClient();

  const [cats, items] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, title, badge, wide, sort")
      .order("sort")
      .order("created_at"),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, group_label, name, note, price, available, sort",
      )
      .order("sort")
      .order("created_at"),
  ]);

  if (cats.error) throw cats.error;
  if (items.error) throw items.error;

  return (
    <MenuManager
      categories={(cats.data ?? []) as AdminCategory[]}
      items={(items.data ?? []) as AdminMenuItem[]}
    />
  );
}
