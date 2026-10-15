"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClubEvent } from "@/data/events";
import { siteConfig } from "@/data/site";
import { splitEvents } from "@/lib/events";
import { buzz } from "@/lib/haptics";
import EventCard from "./EventCard";
import StarLogo from "./StarLogo";
import styles from "./EventsBoard.module.css";

interface EventsBoardProps {
  events: ClubEvent[];
  /** server time, so the first render matches on the client */
  initialNow: number;
}

type View = "upcoming" | "past";

export default function EventsBoard({ events, initialNow }: EventsBoardProps) {
  const [now, setNow] = useState(initialNow);
  const [view, setView] = useState<View>("upcoming");
  const [category, setCategory] = useState("All");

  // refresh the clock so "Today / Tomorrow" is always right, even on a stale cached page
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { upcoming, past } = useMemo(
    () => splitEvents(events, now),
    [events, now],
  );
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(events.map((e) => e.category)))],
    [events],
  );

  const list = (view === "upcoming" ? upcoming : past).filter(
    (e) => category === "All" || e.category === category,
  );

  const pick = (fn: () => void) => () => {
    buzz();
    fn();
  };

  return (
    <div className={styles.board}>
      {/* upcoming / past */}
      <div className={styles.tabs} role="tablist" aria-label="Events">
        <button
          type="button"
          role="tab"
          aria-selected={view === "upcoming"}
          className={styles.tab}
          onClick={pick(() => setView("upcoming"))}
        >
          Upcoming <span>{upcoming.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "past"}
          className={styles.tab}
          onClick={pick(() => setView("past"))}
        >
          Past <span>{past.length}</span>
        </button>
      </div>

      {/* category filter, scrolls sideways on phones */}
      {categories.length > 2 && (
        <ul className={styles.chips} aria-label="Filter by category">
          {categories.map((c) => (
            <li key={c}>
              <button
                type="button"
                className={styles.chip}
                aria-pressed={category === c}
                onClick={pick(() => setCategory(c))}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* list */}
      {list.length > 0 ? (
        <div className={styles.list}>
          {list.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              now={now}
              featured={view === "upcoming" && category === "All" && i === 0}
              past={view === "past"}
            />
          ))}
        </div>
      ) : (
        <div className={`paper ${styles.empty}`}>
          <StarLogo size={64} />
          <p className={styles.emptyTitle}>
            {view === "upcoming" ? "Nothing planned yet" : "Nothing here yet"}
          </p>
          <p className="script">
            {view === "upcoming"
              ? "follow us so you don't miss the next one"
              : "the story is just getting started"}
          </p>
          {view === "upcoming" && (
            <a
              href={siteConfig.instagram}
              className="btn btn--red"
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow on Instagram
            </a>
          )}
        </div>
      )}
    </div>
  );
}
