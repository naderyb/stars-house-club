"use client";

import { useEffect, useState } from "react";
import { getStatus, nowInAlgiers, type AlgiersNow } from "@/lib/hours";
import styles from "./Footer.module.css";

/** "Open now · until 22:00" pill. Computed after mount, so the static page never goes stale. */
export default function FooterStatus() {
  const [now, setNow] = useState<AlgiersNow | null>(null);

  useEffect(() => {
    const first = window.setTimeout(() => setNow(nowInAlgiers()), 0);
    const id = window.setInterval(() => setNow(nowInAlgiers()), 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  const status = now ? getStatus(now) : null;

  return (
    <p
      className={styles.status}
      data-state={status ? (status.open ? "open" : "closed") : "unknown"}
      aria-live="polite"
    >
      {status && (
        <>
          <span className={styles.dot} aria-hidden="true" />
          {status.text}
        </>
      )}
    </p>
  );
}
