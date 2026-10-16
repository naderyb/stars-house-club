import Link from "next/link";
import { siteConfig } from "@/data/site";
import StarLogo from "./StarLogo";
import styles from "./VisitStrip.module.css";

export default function VisitStrip() {
  return (
    <section className="container" aria-labelledby="visit-title">
      <div className={`paper ${styles.card}`}>
        <StarLogo size={72} />
        <div className={styles.text}>
          <h2 id="visit-title" className={styles.title}>
            Hard to find us?
          </h2>
          <p className="script">we&apos;ve got the map abd a human on WhatsApp too!!</p>
        </div>
        <div className={styles.actions}>
          <Link href="/visit" className="btn btn--red">
            How to find us
          </Link>
          <a
            href={siteConfig.mapsUrl}
            className="btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Maps
          </a>
        </div>
      </div>
    </section>
  );
}
