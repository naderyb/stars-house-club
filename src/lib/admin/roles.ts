/** Safe to import from client components: no server code in here. */
export const ROLES = [
  "admin",
  "manager",
  "cashier",
  "waiter",
  "guard",
] as const;
export type Role = (typeof ROLES)[number];

export const roleLabels: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  cashier: "Cashier",
  waiter: "Waiter",
  guard: "Security guard",
};

export const roleHints: Record<Role, string> = {
  admin: "Sees and manages everything, including earnings and the team.",
  manager:
    "Runs the house day to day: registrations (view only), door list, menu, workshops, events and orders. No earnings or stats, and can't change the team.",
  cashier: "Sees orders and prices, and marks them paid. Nothing else.",
  waiter: "Sees and takes orders. Can't mark anything paid.",
  guard: "Sees the door list and the ID of each person. Nothing else.",
};

/** Where each role lands after signing in */
export const roleHome: Record<Role, string> = {
  admin: "/admin",
  manager: "/admin",
  cashier: "/admin/tables",
  waiter: "/admin/tables",
  guard: "/admin/door",
};

/** Single source of truth: who may use what. Pages, API routes and the nav all read this. */
export const ACCESS = {
  /** see the registrations list */
  registrations: ["admin", "manager"],
  /** accept / reject + the WhatsApp messages */
  review: ["admin"],
  door: ["admin", "manager", "guard"],
  /** open the national ID image of a person */
  idView: ["admin", "manager", "guard"],
  menu: ["admin", "manager"],
  workshops: ["admin", "manager"],
  events: ["admin", "manager"],
  orders: ["admin", "manager", "cashier", "waiter"],
  stats: ["admin"],
  /** see who is on the team */
  team: ["admin", "manager"],
  /** add, reset or remove team members */
  teamEdit: ["admin"],
  /** delete a person's ID picture */
  erase: ["admin"],
  /** ban or unban a customer */
  ban: ["admin", "manager"],
} as const satisfies Record<string, readonly Role[]>;

/** Who may do what with orders. The tabs API and the screens both read this. */
export const CAN = {
  takeOrders: ["admin", "manager", "waiter"],
  pay: ["admin", "manager", "cashier"],
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
