import Image from "next/image";
import type { ClubEvent } from "@/data/events";
import { calendarUrl, dateParts, relativeLabel, timeRange } from "@/lib/events";
import styles from "./EventCard.module.css";

interface EventCardProps {
  event: ClubEvent;
  now: number;
  featured?: boolean;
  past?: boolean;
}

export default function EventCard({
  event,
  now,
  featured,
  past,
}: EventCardProps) {
  const { weekday, day, month } = dateParts(event);
  const label = past ? null : relativeLabel(event, now);

  return (
    <article
      id={event.id}
      className={`paper ${styles.card} ${featured ? styles.featured : ""} ${
        past ? styles.past : ""
      }`}
    >
      {featured && <span className={styles.sticker}>Next up ★</span>}

      {event.image && (
        <div className={styles.media}>
          <Image
            src={event.image}
            alt={`Poster of ${event.title}`}
            fill
            sizes="(min-width: 900px) 600px, 90vw"
            className={styles.img}
            unoptimized={event.image.startsWith("http")}
          />
        </div>
      )}

      <div className={styles.row}>
        {/* ticket stub date */}
        <div className={styles.date} aria-hidden="true">
          <span>{weekday}</span>
          <strong>{day}</strong>
          <span>{month}</span>
        </div>

        <div className={styles.body}>
          <p className={styles.when}>
            {label && <span className={styles.label}>{label}</span>}
            <span>{timeRange(event)}</span>
          </p>

          <h3 className={styles.title}>{event.title}</h3>

          <ul className={styles.tags}>
            <li>{event.category}</li>
            {event.price && <li className={styles.price}>{event.price}</li>}
          </ul>

          <p>{event.description}</p>

          {!past && (
            <div className={styles.actions}>
              <a
                href={calendarUrl(event)}
                className="btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                Add to calendar
              </a>
              {event.link && (
                <a
                  href={event.link}
                  className="btn btn--red"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  More info
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
