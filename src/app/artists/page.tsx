import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import SpotlightCard from "@/components/SpotlightCard";
import ArtistsBoard from "@/components/ArtistsBoard";
import { artists, spotlightId } from "@/data/artists";
import { siteConfig } from "@/data/site";
import styles from "./artists.module.css";

export const metadata: Metadata = {
  title: "Artists & Community",
  description:
    "Meet the artists of Stars House Club in Algiers: the monthly Artist Spotlight, exhibited artists, collaborators and who's coming next.",
};

export default function ArtistsPage() {
  const spotlight = artists.find((a) => a.id === spotlightId);
  // the spotlight artist has their own big card, so keep them out of the tabs
  const rest = artists.filter((a) => a.id !== spotlightId);

  return (
    <main className={`container ${styles.page}`}>
      <PageHeader
        title="Club Artists"
        script="artists are at the heart of our house"
      />

      {/* ---------- what the spotlight is ---------- */}
      <Reveal>
        <div className={`paper ${styles.intro}`}>
          <p className={`script ${styles.lead}`}>
            Artist Spotlight is a space where creativity takes center stage.
          </p>
          <p>
            Every month, Stars House invites a different artist to showcase
            their work, share their story and connect with the community.
            Painter, illustrator, photographer, digital artist or creator:
            you&apos;re welcome on our walls.
          </p>
          <p>
            Visitors can explore new artwork, meet local creatives and discover
            fresh perspectives. We believe every artist deserves to be seen,
            supported and celebrated.
          </p>
        </div>
      </Reveal>

      {/* ---------- this month ---------- */}
      {spotlight && (
        <Reveal>
          <SpotlightCard artist={spotlight} />
        </Reveal>
      )}

      {/* ---------- the community ---------- */}
      <section aria-labelledby="community-title" className={styles.section}>
        <h2 id="community-title" className={styles.sectionTitle}>
          The community
        </h2>
        <ArtistsBoard artists={rest} />
      </section>

      {/* ---------- host your art ---------- */}
      <Reveal>
        <div className={styles.host}>
          <p className={styles.hostTitle}>Your art on our walls?</p>
          <p className={`script ${styles.hostText}`}>
            we&apos;d love to see what you make
          </p>
          <div className={styles.actions}>
            <Link href="/join#artist" className="btn">
              Host your art
            </Link>
            <a
              href={siteConfig.instagram}
              className="btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow the house
            </a>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
