"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/data/site";
import StarLogo from "./StarLogo";
import styles from "./JoinPausedNotice.module.css";

/** The message itself. Used inside the popup and on the /join page. */
export function PausedBox({ onClose }: { onClose?: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className={`paper ${styles.box}`}>
      <StarLogo size={64} />
      <h2 id="paused-title" className={styles.title}>
        Sorry, small technical problem!
      </h2>
      <p className={styles.text}>
        Joining online isn&apos;t working right now. Don&apos;t worry, it will
        be back soon.
      </p>
      <p className={styles.script}>
        Until then, just come by. We&apos;ll take care of the rest
      </p>

      <div className={styles.actions}>
        <Link href="/visit" className="btn" onClick={onClose}>
          How to find us
        </Link>
        <Link href="/status" className="btn btn--red" onClick={onClose}>
          Already registered? Check my status
        </Link>
        {onClose && (
          <button
            ref={closeRef}
            type="button"
            className={styles.later}
            onClick={onClose}
          >
            Got it
          </button>
        )}
      </div>
    </div>
  );
}

/** Mounted once in the layout. While joining is paused, any tap on a link
 *  to /join (header, home, footer, anywhere) opens the popup instead. */
export default function JoinPausedNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!siteConfig.joinPaused) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a");
      const href = link?.getAttribute("href") ?? "";
      if (!/^\/join(?:[/?#]|$)/.test(href)) return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    };

    // capture phase: runs before Next's own Link handler
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paused-title"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <PausedBox onClose={() => setOpen(false)} />
    </div>
  );
}
