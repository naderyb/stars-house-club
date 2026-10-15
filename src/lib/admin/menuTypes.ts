export interface AdminCategory {
  id: string;
  title: string;
  badge: string | null;
  wide: boolean;
  sort: number;
}

export interface AdminMenuItem {
  id: string;
  category_id: string;
  group_label: string | null;
  name: string;
  note: string | null;
  price: number;
  available: boolean;
  sort: number;
}
