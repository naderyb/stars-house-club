"use client";

import { useMemo, useState } from "react";
import { toLocalInput, type AdminEvent } from "@/lib/admin/eventTypes";
import EventForm, { type EventValues } from "./EventForm";
import { useAdminCall } from "./useAdminCall";
import ConfirmModal from "./ConfirmModal";
import extra from "./AdminExtras.module.css";
import styles from "./MenuManager.module.css";

const DEFAULT_DURATION = 3 * 60 * 60 * 1000;

const whenFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Algiers",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const endMs = (e: AdminEvent) =>
  e.end_at
    ? new Date(e.end_at).getTime()
    : new Date(e.start_at).getTime() + DEFAULT_DURATION;

interface Props {
  events: AdminEvent[];
  /** server time, so the first render matches on the client */
  now: number;
}

export default function EventManager({ events, now }: Props) {
  const { call, busy, error } = useAdminCall("/api/admin/events");
  /** undefined = closed, null = new event, string = editing that id */
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const [confirming, setConfirming] = useState<AdminEvent | null>(null);

  const { upcoming, past } = useMemo(
    () => ({
      upcoming: events
        .filter((e) => endMs(e) > now)
        .sort(
          (a, b) =>
            new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
        ),
      past: events
        .filter((e) => endMs(e) <= now)
        .sort(
          (a, b) =>
            new Date(b.start_at).getTime() - new Date(a.start_at).getTime(),
        ),
    }),
    [events, now],
  );
  const categories = useMemo(
    () => Array.from(new Set(events.map((e) => e.category))),
    [events],
  );

  const save = async (id: string | null, v: EventValues) => {
    const ok = await call({
      action: "save",
      id: id ?? undefined,
      title: v.title,
      category: v.category,
      description: v.description,
      price: v.price,
      link: v.link.trim(),
      image: v.image,
      announce: v.announce,
      start: v.start,
      end: v.end,
    });
    if (ok) setEditing(undefined);
  };

  const remove = (e: AdminEvent) => {
    setConfirming(e);
  };

  const row = (e: AdminEvent, isPast: boolean) =>
    editing === e.id ? (
      <li key={e.id}>
        <EventForm
          initial={{
            title: e.title,
            category: e.category,
            start: toLocalInput(e.start_at),
            end: e.end_at ? toLocalInput(e.end_at) : "",
            price: e.price ?? "",
            description: e.description,
            link: e.link ?? "",
            image: e.image ?? "",
            announce: e.announce,
          }}
          categories={categories}
          busy={busy}
          onSave={(v) => save(e.id, v)}
          onCancel={() => setEditing(undefined)}
        />
      </li>
    ) : (
      <li key={e.id} className={extra.eventRow} data-past={isPast}>
        <div className={styles.itemMain}>
          <strong className={styles.itemName}>{e.title}</strong>
          <span className={extra.eventWhen}>
            {whenFmt.format(new Date(e.start_at))}
          </span>
        </div>
        <div className={styles.tags}>
          <span className={styles.tag}>{e.category}</span>
          {e.price && <span className={styles.tag}>{e.price}</span>}
          {e.image && <span className={styles.tag}>Poster</span>}
          {!e.announce && <span className={styles.tag}>No banner</span>}
        </div>
        <div className={styles.tools}>
          <button
            type="button"
            onClick={() => setEditing(e.id)}
            disabled={busy}
          >
            Edit
          </button>
          <button
            type="button"
            className={styles.danger}
            onClick={() => remove(e)}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      </li>
    );

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <h1 className={styles.title}>Events</h1>
        <button
          type="button"
          className={styles.add}
          onClick={() => setEditing(null)}
          disabled={busy}
        >
          + Add event
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {editing === null && (
        <div className={`paper ${styles.card}`}>
          <h2 className={styles.formTitle}>New event</h2>
          <EventForm
            categories={categories}
            busy={busy}
            onSave={(v) => save(null, v)}
            onCancel={() => setEditing(undefined)}
          />
        </div>
      )}

      {confirming && (
        <ConfirmModal
          title="Delete event?"
          message={`Delete "${confirming.title}"? This can't be undone.`}
          confirmLabel="Delete event"
          busy={busy}
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            if (await call({ action: "delete", id: confirming.id }))
              setConfirming(null);
          }}
        />
      )}

      {events.length === 0 && editing !== null && (
        <p className={`paper ${styles.empty}`}>
          No events yet. Add your first one.
        </p>
      )}

      {upcoming.length > 0 && (
        <section
          className={`paper ${styles.card}`}
          aria-label="Upcoming events"
        >
          <h2 className={styles.catTitle}>Upcoming ({upcoming.length})</h2>
          <ul className={styles.items}>{upcoming.map((e) => row(e, false))}</ul>
        </section>
      )}

      {past.length > 0 && (
        <section className={`paper ${styles.card}`} aria-label="Past events">
          <h2 className={styles.catTitle}>Past ({past.length})</h2>
          <ul className={styles.items}>{past.map((e) => row(e, true))}</ul>
        </section>
      )}
    </div>
  );
}
