"use client";

import styles from "./Footer.module.css";

export default function BackToTop() {
  const goTop = () => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button type="button" className={styles.toTop} onClick={goTop}>
      Back to top <span aria-hidden="true">↑</span>
    </button>
  );
}
