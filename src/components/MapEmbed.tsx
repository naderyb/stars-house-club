"use client";

import { useState } from "react";
import StarLogo from "./StarLogo";
import styles from "./MapEmbed.module.css";

interface MapEmbedProps {
  src: string;
  href: string;
}

export default function MapEmbed({ src, href }: MapEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  if (loaded && src) {
    return (
      <div className={styles.frame}>
        <iframe
          src={src}
          title="Stars House Club on Google Maps"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className={styles.iframe}
        />
      </div>
    );
  }

  return (
    <div className={`paper ${styles.facade}`}>
      <StarLogo size={64} />
      <p className={`script ${styles.text}`}>we&apos;re right here</p>
      <div className={styles.actions}>
        {src && (
          <button type="button" className="btn" onClick={() => setLoaded(true)}>
            Tap to load the map
          </button>
        )}
        <a
          href={href}
          className="btn btn--red"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}
