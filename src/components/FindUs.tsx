"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { findSteps } from "@/data/visit";
import { buzz } from "@/lib/haptics";
import StarLogo from "./StarLogo";
import styles from "./FindUs.module.css";

export default function FindUs() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const total = findSteps.length;

  // keeps the dots in sync with whatever slide is centered
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting)
            setActive(Number((e.target as HTMLElement).dataset.index));
        });
      },
      { root: track, threshold: 0.6 },
    );
    Array.from(track.children).forEach((child) => io.observe(child));
    return () => io.disconnect();
  }, []);

  const goTo = (i: number) => {
    const track = trackRef.current;
    const slide = track?.children[i] as HTMLElement | undefined;
    if (!track || !slide) return;
    buzz();
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    track.scrollTo({
      left: slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <div className={styles.wrap}>
      <ul
        ref={trackRef}
        className={styles.track}
        aria-label="Step by step directions"
      >
        {findSteps.map((s, i) => (
          <li
            key={s.title}
            data-index={i}
            className={styles.slide}
            aria-label={`Step ${i + 1} of ${total}`}
          >
            <article className={`paper ${styles.card}`}>
              <div className={styles.media}>
                {s.video ? (
                  <video
                    src={s.video}
                    poster={s.poster}
                    controls
                    playsInline
                    preload="none"
                    className={styles.video}
                  />
                ) : s.image ? (
                  <Image
                    src={s.image}
                    alt={s.alt ?? s.title}
                    fill
                    sizes="(min-width: 900px) 33vw, 85vw"
                    className={styles.img}
                  />
                ) : (
                  <div className={styles.placeholder} aria-hidden="true">
                    <StarLogo size={56} />
                  </div>
                )}
                <span className={styles.num}>{i + 1}</span>
              </div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          </li>
        ))}
      </ul>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          aria-label="Previous step"
        >
          ←
        </button>

        <div className={styles.dots}>
          {findSteps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              className={styles.dot}
              aria-label={`Go to step ${i + 1}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.arrow}
          onClick={() => goTo(active + 1)}
          disabled={active === total - 1}
          aria-label="Next step"
        >
          →
        </button>
      </div>

      <p className={`script ${styles.hint}`}>
        step {active + 1} of {total} · swipe to follow the way
      </p>
    </div>
  );
}
