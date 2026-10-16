import Image from "next/image";
import Link from "next/link";
import { navLinks, siteConfig } from "@/data/site";
import BackToTop from "./BackToTop";
import FooterStatus from "./FooterStatus";
import StarLogo from "./StarLogo";
import styles from "./Footer.module.css";

const socials = [
  { label: "Instagram", href: siteConfig.instagram },
  // { label: "TikTok", href: siteConfig.tiktok },
  { label: "WhatsApp", href: siteConfig.whatsapp },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* ---------- brand + "come say hi" ---------- */}
      <div className={`container ${styles.hero}`}>
        <div className={styles.brand}>
          <div className={styles.star} aria-hidden="true">
            <StarLogo size={88} />
          </div>
          <div>
            <p className={styles.wordmark}>
              Stars House
              <br />
              Club
            </p>
            <p className={`script ${styles.slogan}`}>{siteConfig.slogan}</p>
          </div>
        </div>

        <section className={`paper ${styles.card}`} aria-labelledby="footer-hi">
          <h2 id="footer-hi" className={styles.cardTitle}>
            Come say hi
          </h2>
          <FooterStatus />
          <p className={styles.cardText}>
            Hard to find us? We&apos;ve got the map and a human on
            WhatsApp.
          </p>
          <div className={styles.cta}>
            <Link href="/visit" className="btn btn--red">
              How to find us
            </Link>
            <a
              href={siteConfig.whatsapp}
              className="btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </section>
      </div>

      {/* ---------- links ---------- */}
      <div className={`container ${styles.cols}`}>
        <nav aria-labelledby="footer-explore">
          <h2 id="footer-explore" className={styles.colTitle}>
            Explore
          </h2>
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={styles.colTitle}>Follow the house</h2>
          <ul className={styles.socials}>
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  className={styles.pill}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.label} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Image
          src="/images/ppl.webp"
          alt=""
          width={160}
          height={120}
          className={styles.people}
        />
      </div>

      {/* ---------- bottom line ---------- */}
      <div className={`container ${styles.bottom}`}>
        <p>
          © {new Date().getFullYear()} {siteConfig.name} · made with ♥ in{" "}
          {siteConfig.city} by {siteConfig.developer} insta: {siteConfig.developper_social_media}
        </p>
        <BackToTop />
      </div>
    </footer>
  );
}
