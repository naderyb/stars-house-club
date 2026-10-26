import Link from "next/link";
import { siteConfig } from "@/data/site";
import styles from "./Hero.module.css";

const WALL_ROWS = 9;

export default function Hero() {
  return (
    <section className={styles.hero}>
      {/* decorative text wall, like the poster */}
      <div className={styles.wall} aria-hidden="true">
        {Array.from({ length: WALL_ROWS }, (_, i) => (
          <p key={i} className={styles.wallRow}>
            STARS HOUSE CLUB STARS HOUSE CLUB STARS HOUSE CLUB
          </p>
        ))}
      </div>

      <div className={`container ${styles.content}`}>
        <div className={`paper ${styles.card}`}>
          <span className={styles.sticker}>Come as you are</span>

          <h1 className={styles.title}>
            <span className={styles.welcome}>Welcome to the</span>
            <span className={styles.house}>House</span>
          </h1>

          <p className={styles.tagline}>{siteConfig.tagline}</p>

          <div className={styles.actions}>
            <Link href="/events" className="btn">
              See Events
            </Link>
            <Link href="/visit" className="btn">
              Visit Us
            </Link>
            <Link href="/join" className="btn btn--red">
              Join the Community
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
