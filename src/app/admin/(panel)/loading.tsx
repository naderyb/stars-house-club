import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.wrap} role="status" aria-label="Loading">
      <div className={styles.bar} />
      <div className={styles.bar} />
      <div className={styles.bar} />
    </div>
  );
}
