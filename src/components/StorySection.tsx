import Link from "next/link";
import styles from "./StorySection.module.css";

export default function StorySection() {
  return (
    <section className="container" aria-labelledby="story-title">
      <div className={`paper ${styles.card}`}>
        <h2 id="story-title" className={styles.title}>
          The story
        </h2>

        <p className={styles.lead}>
          Stars House Club was created with one simple belief: everyone deserves
          a place where they can create, belong, and express themselves freely.
        </p>

        <p>
          More than a club, café, or art space, it&apos;s a{" "}
          <mark className={styles.mark}>third place</mark>: somewhere beyond
          home, school or work where artists, musicians, creators and dreamers
          come together.
        </p>

        <Link href="/the-house" className="btn">
          Take the house tour
        </Link>
      </div>
    </section>
  );
}
