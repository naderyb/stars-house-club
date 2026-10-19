"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Ban.module.css";

export function BannedBadge() {
  return <span className={styles.badge}>Banned</span>;
}

/** The big red box that can't be missed */
export function BannedAlert({ reason }: { reason: string | null }) {
  return (
    <div className={styles.alert} role="alert">
      <strong>Banned: do not let in</strong>
      {reason && <p>Reason: {reason}</p>}
    </div>
  );
}

interface DialogProps {
  mode: "ban" | "unban";
  name: string;
  busy?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

/** Asks for an optional reason when banning, a simple yes/no when lifting a ban */
export function BanDialog({
  mode,
  name,
  busy,
  onConfirm,
  onCancel,
}: DialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={onCancel}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ban-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="ban-title" className={styles.title}>
          {mode === "ban" ? `Ban ${name}?` : `Lift the ban on ${name}?`}
        </h2>
        <p>
          {mode === "ban"
            ? "Everyone on the door will see a red BANNED warning when they look this person up."
            : "The BANNED warning disappears and they can be let in again if they're accepted."}
        </p>

        {mode === "ban" && (
          <div className={styles.field}>
            <label htmlFor="ban-reason">
              Reason (optional, only the team sees it)
            </label>
            <textarea
              id="ban-reason"
              rows={3}
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. caused trouble on 12 Oct"
              autoFocus
            />
          </div>
        )}

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
            {mode === "ban" ? "Ban this person" : "Lift the ban"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
