/** Safe to import from client components: no server code in here. */
export const ROLES = ["admin", "cashier", "waiter", "guard"] as const;
export type Role = (typeof ROLES)[number];

export const roleLabels: Record<Role, string> = {
  admin: "Admin",
  cashier: "Cashier",
  waiter: "Waiter",
  guard: "Security guard",
};

export const roleHints: Record<Role, string> = {
  admin: "Sees and manages everything.",
  cashier: "Sees orders and prices, and marks them paid. Nothing else.",
  waiter: "Sees and takes orders. Can't mark anything paid.",
  guard: "Sees the door list. Nothing else.",
};

/** Where each role lands after signing in */
export const roleHome: Record<Role, string> = {
  admin: "/admin",
  cashier: "/admin/tables",
  waiter: "/admin/tables",
  guard: "/admin/door",
};

/** Single source of truth: who may use what. Pages, API routes and the nav all read this. */
export const ACCESS = {
  registrations: ["admin"],
  door: ["admin", "guard"],
  menu: ["admin"],
  workshops: ["admin"],
  events: ["admin"],
  orders: ["admin", "cashier", "waiter"],
  stats: ["admin"],
  team: ["admin"],
} as const satisfies Record<string, readonly Role[]>;

/** Who may do what with orders. The tabs API and the screens both read this. */
export const CAN = {
  takeOrders: ["admin", "waiter"],
  pay: ["admin", "cashier"],
} as const satisfies Record<string, readonly Role[]>;

export const navLinks: {
  href: string;
  label: string;
  roles: readonly Role[];
}[] = [
  { href: "/admin", label: "Registrations", roles: ACCESS.registrations },
  { href: "/admin/door", label: "Door list", roles: ACCESS.door },
  { href: "/admin/menu", label: "Menu", roles: ACCESS.menu },
  { href: "/admin/workshops", label: "Workshops", roles: ACCESS.workshops },
  { href: "/admin/events", label: "Events", roles: ACCESS.events },
  { href: "/admin/tables", label: "Orders", roles: ACCESS.orders },
  { href: "/admin/stats", label: "Stats", roles: ACCESS.stats },
  { href: "/admin/team", label: "Team", roles: ACCESS.team },
];
