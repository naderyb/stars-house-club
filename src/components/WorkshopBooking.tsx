"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/data/menu";
import {
  workshops,
  workshopsNote,
  type Workshop,
  type WorkshopOption,
} from "@/data/workshops";
import { buzz } from "@/lib/haptics";
import { whatsappLink } from "@/lib/whatsapp";
import styles from "./WorkshopBooking.module.css";

const MAX_QTY = 9;

export default function WorkshopBooking() {
  const [qty, setQty] = useState<Record<string, number>>({});

  const change = (
    workshop: Workshop,
    option: WorkshopOption,
    delta: number,
  ) => {
    buzz();
    setQty((prev) => {
      const next = { ...prev };
      const value = Math.max(
        0,
        Math.min(MAX_QTY, (prev[option.id] ?? 0) + delta),
      );
      if (value === 0) delete next[option.id];
      else next[option.id] = value;

      // add-ons disappear when their base option is removed
      const hasBase = workshop.options.some((o) => !o.addOn && next[o.id]);
      if (!hasBase) {
        workshop.options.forEach((o) => {
          if (o.addOn) delete next[o.id];
        });
      }
      return next;
    });
  };

  const lines = useMemo(
    () =>
      workshops.flatMap((w) =>
        w.options
          .filter((o) => qty[o.id])
          .map((o) => ({
            id: o.id,
            workshop: w.title,
            name: o.note ? `${o.name} ${o.note}` : o.name,
            price: o.price,
            qty: qty[o.id],
          })),
      ),
    [qty],
  );

  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  const message = [
    "Hi Stars House Club! I'd like to book:",
    ...lines.map(
      (l) =>
        `- ${l.qty}x ${l.name} (${l.workshop}): ${formatPrice(l.price * l.qty)}`,
    ),
    `Total: ${formatPrice(total)}`,
    "Preferred day and time:",
  ].join("\n");

  return (
    <div className={count > 0 ? styles.hasBar : undefined}>
      <div className={styles.grid}>
        {workshops.map((w) => {
          const hasBase = w.options.some((o) => !o.addOn && qty[o.id]);

          return (
            <section
              key={w.id}
              className={`paper ${styles.card}`}
              aria-labelledby={`${w.id}-title`}
            >
              <div className={styles.head}>
                <h2 id={`${w.id}-title`} className={styles.title}>
                  {w.title}
                </h2>
                {w.ar && (
                  <span className={styles.ar} lang="ar" dir="rtl">
                    {w.ar}
                  </span>
                )}
              </div>

              <p className={styles.blurb}>{w.blurb}</p>
              {w.materials && <p className={styles.materials}>{w.materials}</p>}

              <ul className={styles.options}>
                {w.options.map((o) => {
                  const value = qty[o.id] ?? 0;
                  const locked = o.addOn && !hasBase;
                  const label = o.note ? `${o.name} ${o.note}` : o.name;

                  return (
                    <li
                      key={o.id}
                      className={styles.option}
                      data-selected={value > 0}
                    >
                      <div className={styles.info}>
                        <span className={styles.name}>
                          {o.name}
                          {o.note && <small> {o.note}</small>}
                        </span>
                        {locked && (
                          <span className={styles.hint}>
                            pick a clay size first
                          </span>
                        )}
                      </div>

                      <span className={styles.price}>
                        {formatPrice(o.price)}
                      </span>

                      {value === 0 ? (
                        <button
                          type="button"
                          className={styles.add}
                          disabled={locked}
                          onClick={() => change(w, o, 1)}
                          aria-label={`Add ${label}`}
                        >
                          Add
                        </button>
                      ) : (
                        <div className={styles.stepper}>
                          <button
                            type="button"
                            onClick={() => change(w, o, -1)}
                            aria-label={`Remove one ${label}`}
                          >
                            −
                          </button>
                          <span className={styles.qty} aria-live="polite">
                            {value}
                          </span>
                          <button
                            type="button"
                            onClick={() => change(w, o, 1)}
                            aria-label={`Add one more ${label}`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <p className={styles.note}>{workshopsNote}</p>

      {count > 0 && (
        <div
          className={styles.bar}
          role="region"
          aria-label="Your booking"
          aria-live="polite"
        >
          <div>
            <p className={styles.count}>
              {count} {count === 1 ? "item" : "items"}
            </p>
            <p className={styles.total}>{formatPrice(total)}</p>
          </div>
          <div className={styles.barActions}>
            <button
              type="button"
              className={styles.clear}
              onClick={() => setQty({})}
            >
              Clear
            </button>
            <a
              href={whatsappLink(message)}
              className="btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
