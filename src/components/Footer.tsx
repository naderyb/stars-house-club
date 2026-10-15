import Link from "next/link";
import { navLinks, siteConfig } from "@/data/site";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div>
          <p className={styles.name}>{siteConfig.name}</p>
          <p className="script">{siteConfig.slogan}</p>
        </div>

        <nav aria-label="Footer" className={styles.links}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.links}>
          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a href={siteConfig.tiktok} target="_blank" rel="noopener noreferrer">
            TikTok
          </a>
          <a
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </div>
      </div>
      <p className={styles.copy}>
        © {new Date().getFullYear()} {siteConfig.name}
      </p>
    </footer>
  );
}
