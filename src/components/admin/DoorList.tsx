"use client";

import { useMemo, useState } from "react";
import type { DoorPerson, Role } from "@/lib/admin/types";
import { RoleBadge, StatusBadge } from "./StatusBadge";
import styles from "./DoorList.module.css";

/** lowercase and strip accents, so "Amélie" matches "amelie" */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function DoorList({ people }: { people: DoorPerson[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");

  const results = useMemo(() => {
    const q = fold(query.trim());
    const digits = query.replace(/\D/g, "").replace(/^0+/, "");

    return people.filter((p) => {
      if (role !== "all" && p.role !== role) return false;
      if (!q) return true;

      const text = fold(
        [p.full_name, p.stage_name, p.email, p.instagram]
          .filter(Boolean)
          .join(" "),
      );
      const phoneHit =
        digits.length >= 4 && p.phone.replace(/\D/g, "").includes(digits);
      return text.includes(q) || phoneHit;
    });
  }, [people, query, role]);

  const count = (r: "all" | Role) =>
    r === "all" ? people.length : people.filter((p) => p.role === r).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search by name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the door list"
          autoComplete="off"
        />

        <div className={styles.chips}>
          {(["all", "artist", "visitor"] as const).map((r) => (
            <button
              key={r}
              type="button"
              className={styles.chip}
              aria-pressed={role === r}
              onClick={() => setRole(r)}
            >
              {r === "all"
                ? "Everyone"
                : r === "artist"
                  ? "Artists"
                  : "Visitors"}
              <span>{count(r)}</span>
            </button>
          ))}
        </div>
      </div>

      <p className={styles.reminder}>
        Only let in people marked <strong>Accepted</strong>. Check their ID.
      </p>

      <p className={styles.count} aria-live="polite">
        {results.length} {results.length === 1 ? "person" : "people"}
      </p>

      {results.length === 0 ? (
        <p className={`paper ${styles.empty}`}>Nobody found.</p>
      ) : (
        <ul className={styles.list}>
          {results.map((p) => (
            <li key={p.id} className={styles.row} data-status={p.status}>
              <div className={styles.who}>
                <strong className={styles.name}>{p.full_name}</strong>
                {p.stage_name && (
                  <span className={styles.stage}>aka {p.stage_name}</span>
                )}
                <span className={styles.contact}>{p.email ?? p.phone}</span>
              </div>
              <div className={styles.badges}>
                <StatusBadge status={p.status} />
                <RoleBadge role={p.role} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
