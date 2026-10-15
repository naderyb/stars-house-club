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

/** What can be typed into the order box: name + price from the menu */
export interface MenuChoice {
  name: string;
  price: number;
}

export const orderTotal = (items: AdminOrderItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0);
