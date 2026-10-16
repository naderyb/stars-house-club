import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import FloorPlan from "@/components/FloorPlan";
import StarLogo from "@/components/StarLogo";
import { houseStory } from "@/data/house";
import styles from "./the-house.module.css";

export const metadata: Metadata = {
  title: "The House",
  description:
    "The story of Stars House Club and a tour of the house: gallery, living room, stage, workshop area and more.",
};

export default function TheHousePage() {
  return (
    <main className={`container ${styles.page}`}>
      <PageHeader
        title="Club House Tour"
        script="every corner of the house, mapped out"
      />

      {/* ---------- story ---------- */}
      <section aria-labelledby="story-title" className={styles.story}>
        <Reveal>
          <div className={`paper ${styles.leadCard}`}>
            <h2 id="story-title" className={styles.storyTitle}>
              The story of Stars House Club
            </h2>
            <p className={`script ${styles.lead}`}>{houseStory.lead}</p>
          </div>
        </Reveal>

        {houseStory.paragraphs.map((text, i) => (
          <Reveal key={i} className={i % 2 === 0 ? styles.left : styles.right}>
            <p className={`paper ${styles.para}`}>{text}</p>
          </Reveal>
        ))}

        <Reveal>
          <blockquote className={styles.quote}>
            <StarLogo size={48} />
            <p>{houseStory.closing}</p>
          </blockquote>
        </Reveal>
      </section>

      {/* ---------- tour ---------- */}
      <section aria-labelledby="tour-title" className={styles.tour}>
        <Reveal>
          <h2 id="tour-title" className={styles.tourTitle}>
            Take the tour
          </h2>
        </Reveal>
        <FloorPlan />
      </section>

      <Reveal>
        <div className={`paper ${styles.cta}`}>
          <p className={styles.ctaTitle}>
            You&apos;ve got the map, now act like you live here.
          </p>
          <p className={`script ${styles.ctaText}`}>welcome home ♥</p>
        </div>
      </Reveal>
    </main>
  );
}
