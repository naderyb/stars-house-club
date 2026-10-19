"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { instagramLabel } from "@/lib/instagram";
import type { DoorPerson } from "@/lib/admin/types";
import { BanDialog, BannedAlert } from "./BanParts";
import IdViewer from "./IdViewer";
import { RoleBadge, StatusBadge } from "./StatusBadge";
import styles from "./Ban.module.css";

interface Props {
  person: DoorPerson;
  onClose: () => void;
  canBan: boolean;
  onBan: (id: string, banned: boolean, reason: string) => void;
}

export default function PersonSheet({ person, onClose, canBan, onBan }: Props) {
  const [banDialog, setBanDialog] = useState(false);

  // Escape closes the popup, unless the ban dialog is open (it handles its own Escape)
  useEffect(() => {
    if (banDialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, banDialog]);

  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="person-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {person.banned && <BannedAlert reason={person.ban_reason} />}

        <h2 id="person-title" className={styles.title}>
          {person.full_name}
        </h2>
        {person.stage_name && <p>aka {person.stage_name}</p>}

        <div className={styles.badges}>
          <StatusBadge status={person.status} />
          <RoleBadge role={person.role} />
        </div>

        <div className={styles.facts}>
          <span>WhatsApp: {person.phone}</span>
          {person.email && <span>Email: {person.email}</span>}
          {person.instagram && (
            <span>Instagram: {instagramLabel(person.instagram)}</span>
          )}
        </div>

        {person.has_id ? (
          <IdViewer id={person.id} name={person.full_name} />
        ) : (
          <p>No ID on file.</p>
        )}

        {canBan && (
          <button
            type="button"
            className={styles.btn}
            data-tone={person.banned ? undefined : "danger"}
            onClick={() => setBanDialog(true)}
          >
            {person.banned ? "Lift the ban" : "Ban this person"}
          </button>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.ok} onClick={onClose}>
            {person.banned ? "Understood, I won't let them in" : "Close"}
          </button>
        </div>
      </section>

      {banDialog && (
        <BanDialog
          mode={person.banned ? "unban" : "ban"}
          name={person.full_name}
          onCancel={() => setBanDialog(false)}
          onConfirm={(reason) => {
            setBanDialog(false);
            onBan(person.id, !person.banned, reason);
          }}
        />
      )}
    </div>,
    document.body,
  );
}
