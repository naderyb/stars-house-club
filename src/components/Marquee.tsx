import styles from "./Marquee.module.css";

const ITEMS = ["Art", "Music", "Creativity", "Community", "Stars House Club"];

export default function Marquee() {
  return (
    <div className={styles.marquee} aria-hidden="true">
      <div className={styles.track}>
        {[0, 1].map((n) => (
          <ul key={n} className={styles.group}>
            {ITEMS.concat(ITEMS).map((item, i) => (
              <li key={`${n}-${i}`}>
                {item} <span aria-hidden="true">·</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
