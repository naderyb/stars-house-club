export interface AdminWorkshop {
  visible: boolean;
  ar: string;
  id: string;
  title: string;
  title_ar: string | null;
  blurb: string;
  materials: string | null;
  active: boolean;
  sort: number;
}

export interface AdminWorkshopOption {
  id: string;
  workshop_id: string;
  name: string;
  note: string | null;
  price: number;
  add_on: boolean;
  sort: number;
}
