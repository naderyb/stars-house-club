"use client";

import { useEffect, useState } from "react";
import { dayNames, hours, weekOrder } from "@/data/visit";
import styles from "./HoursCard.module.css";

const DAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Current weekday and minutes in Algiers, whatever the visitor's timezone is */
function nowInAlgiers() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Algiers",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: DAY_INDEX[get("weekday")],
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function getStatus(now: { day: number; minutes: number }) {
  const today = hours[now.day];

  if (
    today &&
    now.minutes >= toMinutes(today.open) &&
    now.minutes < toMinutes(today.close)
  ) {
    return { open: true, text: `Open now · until ${today.close}` };
  }
  if (today && now.minutes < toMinutes(today.open)) {
    return { open: false, text: `Closed · opens today at ${today.open}` };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (now.day + i) % 7;
    const next = hours[d];
    if (next) {
      const when = i === 1 ? "tomorrow" : dayNames[d];
      return { open: false, text: `Closed · opens ${when} at ${next.open}` };
    }
  }
  return { open: false, text: "Closed" };
}

export default function HoursCard() {
  // computed after mount to avoid server/client mismatch
  const [now, setNow] = useState<{ day: number; minutes: number } | null>(null);

  useEffect(() => {
    const initialUpdate = window.setTimeout(() => setNow(nowInAlgiers()), 0);
    const id = setInterval(() => setNow(nowInAlgiers()), 60_000);
    return () => {
      clearTimeout(initialUpdate);
      clearInterval(id);
    };
  }, []);

  const status = now ? getStatus(now) : null;

  return (
    <section className={`paper ${styles.card}`} aria-labelledby="hours-title">
      <h2 id="hours-title" className={styles.title}>
        Opening hours
      </h2>

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

      <table className={styles.table}>
        <tbody>
          {weekOrder.map((d) => {
            const h = hours[d];
            return (
              <tr key={d} data-today={now?.day === d}>
                <th scope="row">{dayNames[d]}</th>
                <td>{h ? `${h.open} – ${h.close}` : "Closed"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
