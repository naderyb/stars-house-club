"use client";

import { useState } from "react";
import { groups, type Artist, type ArtistGroup } from "@/data/artists";
import { buzz } from "@/lib/haptics";
import ArtistCard from "./ArtistCard";
import Reveal from "./Reveal";
import StarLogo from "./StarLogo";
import styles from "./ArtistsBoard.module.css";

export default function ArtistsBoard({ artists }: { artists: Artist[] }) {
  const [active, setActive] = useState<ArtistGroup>("exhibited");

  const current = groups.find((g) => g.id === active) ?? groups[0];
  const list = artists.filter((a) => a.group === active);

  return (
    <div className={styles.board}>
      <div className={styles.tabs} role="tablist" aria-label="Artists">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={g.id === active}
            className={styles.tab}
            onClick={() => {
              buzz();
              setActive(g.id);
            }}
          >
            {g.label}
            <span>{artists.filter((a) => a.group === g.id).length}</span>
          </button>
        ))}
      </div>

      {list.length > 0 ? (
        <div key={active} className={styles.grid}>
          {list.map((artist) => (
            <Reveal key={artist.id} className={styles.item}>
              <ArtistCard artist={artist} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className={`paper ${styles.empty}`}>
          <StarLogo size={56} />
          <p className="script">{current.empty}</p>
        </div>
      )}
    </div>
  );
}
