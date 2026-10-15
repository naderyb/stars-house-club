import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/data/artists";
import { instagramLabel, instagramUrl } from "@/lib/instagram";
import styles from "./SpotlightCard.module.css";

export default function SpotlightCard({ artist }: { artist: Artist }) {
  return (
    <section className={styles.card} aria-labelledby="spotlight-title">
      <span className={styles.badge}>Artist Spotlight</span>
      <span className={styles.free}>Free</span>

      <div className={styles.media}>
        <div className={styles.tape} aria-hidden="true" />
        <div className={styles.photo}>
          {artist.image ? (
            <Image
              src={artist.image}
              alt={`${artist.name}, ${artist.craft}`}
              fill
              priority
              sizes="(min-width: 800px) 40vw, 80vw"
              className={styles.img}
            />
          ) : (
            <span className={styles.monogram} aria-hidden="true">
              {artist.name.charAt(0)}
            </span>
          )}
        </div>
      </div>

      <div className={styles.text}>
        {artist.when && (
          <p className={`script ${styles.when}`}>{artist.when}</p>
        )}
        <h2 id="spotlight-title" className={styles.name}>
          {artist.name}
        </h2>
        <p className={styles.craft}>{artist.craft}</p>
        {artist.bio && <p>{artist.bio}</p>}

        <div className={styles.actions}>
          {artist.instagram && (
            <a
              href={instagramUrl(artist.instagram)}
              className="btn btn--red"
              target="_blank"
              rel="noopener noreferrer"
            >
              {instagramLabel(artist.instagram)}
            </a>
          )}
          {artist.eventId && (
            <Link href={`/events#${artist.eventId}`} className="btn">
              See the event
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
