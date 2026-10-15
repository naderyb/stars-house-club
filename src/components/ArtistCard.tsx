import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/data/artists";
import { instagramLabel, instagramUrl } from "@/lib/instagram";
import styles from "./ArtistCard.module.css";

export default function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <article className={styles.card}>
      <div className={styles.tape} aria-hidden="true" />

      <div className={styles.photo}>
        {artist.image ? (
          <Image
            src={artist.image}
            alt={`${artist.name}, ${artist.craft}`}
            fill
            sizes="(min-width: 1000px) 22vw, (min-width: 700px) 30vw, 45vw"
            className={styles.img}
          />
        ) : (
          <span className={styles.monogram} aria-hidden="true">
            {artist.name.charAt(0)}
          </span>
        )}
      </div>

      <h3 className={styles.name}>{artist.name}</h3>
      <p className={styles.craft}>{artist.craft}</p>
      {artist.when && <p className={styles.when}>{artist.when}</p>}

      {artist.bio && (
        <details className={styles.more}>
          <summary>About</summary>
          <p>{artist.bio}</p>
        </details>
      )}

      <div className={styles.links}>
        {artist.instagram && (
          <a
            href={instagramUrl(artist.instagram)}
            className={styles.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {instagramLabel(artist.instagram)}
          </a>
        )}
        {artist.eventId && (
          <Link href={`/events#${artist.eventId}`} className={styles.link}>
            See event
          </Link>
        )}
      </div>
    </article>
  );
}
