"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks, siteConfig } from "@/data/site";
import StarLogo from "./StarLogo";
import styles from "./Header.module.css";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
          <StarLogo size={36} />
          <span>{siteConfig.name}</span>
        </Link>

        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Explore"}
        </button>

        <nav
          id="main-nav"
          className={`${styles.nav} ${open ? styles.navOpen : ""}`}
          aria-label="Main"
        >
          {navLinks
            .filter((link) => link.href !== "/join")
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${
                  pathname === link.href ? styles.active : ""
                }`}
                aria-current={pathname === link.href ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
        </nav>

        <Link
          href="/join"
          className={`${styles.link} ${styles.cta} ${
            pathname === "/join" ? styles.active : ""
          }`}
          aria-current={pathname === "/join" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          Join
        </Link>
      </div>
    </header>
  );
}
