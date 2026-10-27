export interface AdminTable {
  id: string;
  number: number;
}

export interface AdminOrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface AdminOrder {
  id: string;
  table_id: string | null;
  table_label: string;
  created_at: string;
  items: AdminOrderItem[];
}

export interface PaidOrder {
  id: string;
  table_id: string | null;
  table_label: string;
  total: number;
  paid_at: string;
}

/** One orderable menu item, with the section it belongs to */
export interface MenuChoice {
  name: string;
  price: number;
  /** the menu section's title, e.g. "Hot drinks" */
  section?: string;
}

export const orderTotal = (items: AdminOrderItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0);
