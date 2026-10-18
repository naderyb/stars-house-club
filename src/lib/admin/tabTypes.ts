export interface TabItem {
  id: string;
  name: string;
  price: number;
  qty: number;

  paid_at: string | null;
}

export interface Tab {
  id: string;
  name: string;
  created_at: string;
  created_by: string | null;
  items: TabItem[];
}

export const lineTotal = (i: TabItem) => i.price * i.qty;

/** what this person still owes */
export const unpaidTotal = (items: TabItem[]) =>
  items.filter((i) => !i.paid_at).reduce((sum, i) => sum + lineTotal(i), 0);

/** what they already paid on this tab */
export const paidTotal = (items: TabItem[]) =>
  items.filter((i) => i.paid_at).reduce((sum, i) => sum + lineTotal(i), 0);

/** A tab that was settled today (admin only, for "Recently paid") */
export interface ClosedTab {
  id: string;
  name: string;
  closed_at: string;
  total: number;
}
