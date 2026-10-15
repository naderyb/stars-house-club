export interface MenuItem {
  name: string;
  price: number;
  note?: string;
}

export interface MenuGroup {
  title?: string;
  items: MenuItem[];
}

export interface MenuSection {
  id: string;
  title: string;
  badge?: string;
  wide?: boolean;
  groups: MenuGroup[];
}

export const CURRENCY = "DA";

export const formatPrice = (price: number) => `${price} ${CURRENCY}`;

export const menuNote =
  "We keep our prices friendly so you can stay, create, connect & enjoy. So please respect the place, the art, and the people around you <3";

export const menuSections: MenuSection[] = [
  {
    id: "cold-drinks",
    title: "Cold Drinks",
    groups: [
      {
        title: "Soda",
        items: [
          { name: "Coca", price: 150 },
          { name: "Hamoud", price: 150 },
          { name: "Izem", price: 150 },
          { name: "Orangina", price: 150 },
          { name: "Jus Ifruit", price: 150 },
          { name: "Water", price: 50 },
        ],
      },
    ],
  },
  {
    id: "hot-drinks",
    title: "Hot Drinks",
    groups: [
      {
        title: "Coffee",
        items: [
          { name: "Espresso", price: 200 },
          { name: "Americano", price: 200 },
          { name: "Cappuccino", price: 250 },
          { name: "Latte", price: 250 },
          { name: "Mocha", price: 300 },
        ],
      },
      {
        title: "Tea",
        items: [
          { name: "Green tea", price: 200 },
          { name: "Infusion tea", price: 200 },
          { name: "Spill the tea pack", note: "x4", price: 350 },
        ],
      },
    ],
  },
  {
    id: "dessert",
    title: "Dessert",
    badge: "Homemade!",
    wide: true,
    groups: [
      {
        items: [
          { name: "Croissant", price: 100 },
          { name: "Pain au chocolat", price: 100 },
          { name: "Cake", note: "Mouscoutchou", price: 100 },
          { name: "Mini tarte de citron", price: 150 },
          { name: "Pancakes", price: 250 },
          { name: "Tiramisu", price: 300 },
          { name: "Halla", price: 300 },
          { name: "Cookie", price: 300 },
          { name: "Brownie", price: 300 },
        ],
      },
    ],
  },
];
