"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navLinks, type Role } from "@/lib/admin/roles";
import styles from "./AdminNav.module.css";

export default function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    ...navLinks.filter((l) => l.roles.includes(role)),
    { href: "/admin/setup", label: "My login" },
  ];

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
