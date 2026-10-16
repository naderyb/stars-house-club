"use client";

import { useEffect, useRef } from "react";
import styles from "./FindUs.module.css";

export default function FindUs() {
  const trackRef = useRef<HTMLUListElement>(null);

  // keeps the dots in sync with whatever slide is centered
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !("IntersectionObserver" in window)) return;
  }, []);

  return (
    <div className={styles.wrap}>
    </div>
  );
}
