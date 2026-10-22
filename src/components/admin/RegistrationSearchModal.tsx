"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AdminRegistration } from "@/lib/admin/types";
import { RoleBadge, StatusBadge } from "./StatusBadge";
import styles from "./RegistrationSearchModal.module.css";

interface Props {
  registrations: AdminRegistration[];
  onSelect: (registration: AdminRegistration) => void;
  onClose: () => void;
}

export default function RegistrationSearchModal({
  registrations,
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) return registrations;
    return registrations.filter((registration) =>
      [
        registration.full_name,
        registration.stage_name,
        registration.phone,
        registration.email,
        registration.instagram,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery)),
    );
  }, [normalizedQuery, registrations]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-search-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.heading}>
          <h2 id="registration-search-title">Find a registration</h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close search"
          >
            ×
          </button>
        </div>
        <input
          ref={inputRef}
          type="search"
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, phone, email, or Instagram"
          aria-label="Search registrations"
          autoComplete="off"
        />
        <p className={styles.count} aria-live="polite">
          {results.length} {results.length === 1 ? "registration" : "registrations"}
        </p>
        <div className={styles.results}>
          {results.length === 0 ? (
            <p className={styles.empty}>No registrations match that search.</p>
          ) : (
            results.map((registration) => (
              <button
                key={registration.id}
                type="button"
                className={styles.result}
                onClick={() => onSelect(registration)}
              >
                <span className={styles.resultName}>{registration.full_name}</span>
                {registration.stage_name && (
                  <span className={styles.stageName}>{registration.stage_name}</span>
                )}
                <span className={styles.badges}>
                  <RoleBadge role={registration.role} />
                  <StatusBadge status={registration.status} />
                </span>
                <span className={styles.contact}>
                  {registration.phone}
                  {registration.email && ` · ${registration.email}`}
                </span>
              </button>
            ))
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
