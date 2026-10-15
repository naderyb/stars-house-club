"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./AdminNav.module.css";

const links = [
  { href: "/admin", label: "Registrations" },
  { href: "/admin/door", label: "Door list" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/workshops", label: "Workshops" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/tables", label: "Tables" },
  { href: "/admin/stats", label: "Stats" },
  { href: "/admin/setup", label: "My login" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <nav className={styles.nav} aria-label="Admin">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={styles.link}
          aria-current={pathname === l.href ? "page" : undefined}
        >
          {l.label}
        </Link>
      ))}
      <button type="button" className={styles.logout} onClick={logout}>
        Log out
      </button>
    </nav>
  );
}
