"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DoorPerson } from "@/lib/admin/types";
import { BannedBadge } from "./BanParts";
import { RoleBadge, StatusBadge } from "./StatusBadge";
import styles from "./RegistrationSearchModal.module.css";

interface Props {
  people: DoorPerson[];
  onSelect: (person: DoorPerson) => void;
  onClose: () => void;
}

/** most results drawn at once: typing more narrows it down */
const MAX = 30;

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function DoorSearchModal({ people, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = fold(query.trim());

  // built once: everyone's searchable text, so typing stays instant
  const index = useMemo(
    () =>
      people.map((person) => ({
        person,
        text: fold(
          [person.full_name, person.stage_name, person.email, person.instagram]
            .filter(Boolean)
            .join(" "),
        ),
        digits: person.phone.replace(/\D/g, ""),
      })),
    [people],
  );

  const results = useMemo(() => {
    const digits = query.replace(/\D/g, "").replace(/^0+/, "");
    return index
      .filter(
        (entry) =>
          !normalizedQuery ||
          entry.text.includes(normalizedQuery) ||
          (digits.length >= 4 && entry.digits.includes(digits)),
      )
      .map((entry) => entry.person);
  }, [index, normalizedQuery, query]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="door-search-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.heading}>
          <h2 id="door-search-title">Find someone at the door</h2>
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
          aria-label="Search the door list"
          autoComplete="off"
        />
        <p className={styles.count} aria-live="polite">
          {results.length} {results.length === 1 ? "person" : "people"}
        </p>
        <div className={styles.results}>
          {results.length === 0 ? (
            <p className={styles.empty}>Nobody found.</p>
          ) : (
            results.slice(0, MAX).map((person) => (
              <button
                key={person.id}
                type="button"
                className={styles.result}
                onClick={() => onSelect(person)}
              >
                <span className={styles.resultName}>{person.full_name}</span>
                {person.stage_name && (
                  <span className={styles.stageName}>
                    aka {person.stage_name}
                  </span>
                )}
                <span className={styles.badges}>
                  {person.banned && <BannedBadge />}
                  <StatusBadge status={person.status} />
                  <RoleBadge role={person.role} />
                </span>
                <span className={styles.contact}>
                  {person.email ?? person.phone}
                </span>
              </button>
            ))
          )}
          {results.length > MAX && (
            <p className={styles.empty}>
              Showing the first {MAX}. Keep typing to narrow it down.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
