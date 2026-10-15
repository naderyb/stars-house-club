import Link from "next/link";
import { exploreCards } from "@/data/home";
import styles from "./ExploreGrid.module.css";

export default function ExploreGrid() {
  return (
    <section
      className={`container ${styles.section}`}
      aria-labelledby="explore-title"
    >
      <h2 id="explore-title" className={styles.heading}>
        Make yourself at home
      </h2>

      <div className={styles.grid}>
        {exploreCards.map((card, i) => (
          <Link
            key={card.href}
            href={card.href}
            className={`paper ${styles.card}`}
          >
            <span className={styles.num}>0{i + 1}</span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            <span className={styles.more}>Open →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
