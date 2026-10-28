"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Ban.module.css";

const SUGGESTIONS = [
  "We're full for now. Please try again later.",
  "Some of your information was incomplete.",
  "We couldn't verify your details.",
];

interface Props {
  name: string;
  busy?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function RejectDialog({
  name,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={onCancel}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="reject-title" className={styles.title}>
          Reject {name}?
        </h2>
        <p>
          You can leave a reason, or skip it. If you write one,{" "}
          <strong>they will read it</strong> on the status page, so keep it
          short and kind.
        </p>

        <div className={styles.chips}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={styles.chip}
              onClick={() => setReason(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className={styles.field}>
          <label htmlFor="reject-reason">Reason (optional)</label>
          <textarea
            id="reject-reason"
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Leave empty to give no reason"
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.danger}
            onClick={() => onConfirm(reason)}
            disabled={busy}
          >
            {reason.trim() ? "Reject with reason" : "Reject"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
