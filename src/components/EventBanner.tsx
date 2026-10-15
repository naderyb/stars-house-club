"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { ClubEvent } from "@/data/events";
import {
  dateParts,
  endMs,
  relativeLabel,
  startMs,
  timeRange,
} from "@/lib/events";
import { buzz } from "@/lib/haptics";
import styles from "./EventBanner.module.css";

const STORAGE_KEY = "shc-dismissed-event";

export default function EventBanner() {
  const pathname = usePathname();
  // Keep time-based rendering client-only: the site is static, so a build-time
  // date would be stale, and rendering it on the server would cause a mismatch.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(frame);
  }, []);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [events, setEvents] = useState<ClubEvent[]>([]);

  // The list comes from the admin-managed database. Keep the notification on
  // every public page so visitors do not miss an announced event.
  const showHere = !pathname.startsWith("/admin");
  useEffect(() => {
    if (!showHere) return;
    let cancelled = false;
    fetch("/api/events", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.events)) setEvents(data.events);
      })
      .catch(() => {
        /* no banner if the list can't be loaded */
      });
    return () => {
      cancelled = true;
    };
  }, [showHere]);

  const storedDismissed = mounted
    ? (() => {
        try {
          return localStorage.getItem(STORAGE_KEY);
        } catch {
          /* storage blocked: banner just shows every time */
          return null;
        }
      })()
    : null;

  const dismissedId = dismissed ?? storedDismissed;

  if (now === null || !showHere) return null;

  const event = events
    .filter(
      (e) =>
        e.announce !== false &&
        endMs(e) > now,
    )
    .sort((a, b) => startMs(a) - startMs(b))[0];

  if (!event || dismissedId === event.id) return null;

  const { weekday, day, month } = dateParts(event);
  const label = relativeLabel(event, now) ?? "Coming up";

  const dismiss = () => {
    buzz();
    setDismissed(event.id);
    try {
      localStorage.setItem(STORAGE_KEY, event.id);
    } catch {
      /* ignore */
    }
  };

  return (
    <aside className={styles.banner} role="status" aria-label="Upcoming event">
      <Link href={`/events#${event.id}`} className={styles.link}>
        <span className={styles.label}>{label}</span>
        <span className={styles.text}>
          <strong className={styles.title}>{event.title}</strong>
          <span className={styles.when}>
            {weekday} {day} {month} · {timeRange(event)}
          </span>
        </span>
        <span className={styles.cta} aria-hidden="true">
          Details →
        </span>
      </Link>

      <button
        type="button"
        className={styles.close}
        onClick={dismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </aside>
  );
}
