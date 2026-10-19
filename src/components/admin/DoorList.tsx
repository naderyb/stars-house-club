"use client";

import { useMemo, useState } from "react";
import type { DoorPerson, Role } from "@/lib/admin/types";
import { BannedBadge } from "./BanParts";
import PersonSheet from "./PersonSheet";
import { RoleBadge, StatusBadge } from "./StatusBadge";
import styles from "./DoorList.module.css";

/** lowercase and strip accents, so "Amélie" matches "amelie" */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

type Filter = "all" | Role | "banned";

const LABELS: Record<Filter, string> = {
  all: "Everyone",
  artist: "Artists",
  visitor: "Visitors",
  banned: "Banned",
};

export default function DoorList({
  people: initial,
  canBan,
}: {
  people: DoorPerson[];
  canBan: boolean;
}) {
  const [people, setPeople] = useState(initial);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = people.find((p) => p.id === selectedId) ?? null;

  const matches = (p: DoorPerson, f: Filter) =>
    f === "all" ? true : f === "banned" ? p.banned : p.role === f;

  const results = useMemo(() => {
    const q = fold(query.trim());
    const digits = query.replace(/\D/g, "").replace(/^0+/, "");

    return people.filter((p) => {
      if (!matches(p, filter)) return false;
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
  }, [people, query, filter]);

  const count = (f: Filter) => people.filter((p) => matches(p, f)).length;

  const ban = async (id: string, banned: boolean, reason: string) => {
    setError("");
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, banned, reason }),
      });
      if (!res.ok) throw new Error();
      setPeople((list) =>
        list.map((p) =>
          p.id === id
            ? { ...p, banned, ban_reason: banned ? reason.trim() || null : null }
            : p,
        ),
      );
    } catch {
      setError("Could not save the ban. Please try again.");
    }
  };

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
          {(["all", "artist", "visitor", "banned"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={styles.chip}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {LABELS[f]}
              <span>{count(f)}</span>
            </button>
          ))}
        </div>
      </div>

      <p className={styles.reminder}>
        Only let in people marked <strong>Accepted</strong>, and never anyone{" "}
        <strong>Banned</strong>. Tap a name to check the ID.
      </p>

      <p className={styles.count} aria-live="polite">
        {results.length} {results.length === 1 ? "person" : "people"}
      </p>

      {error && (
        <p className={styles.reminder} role="alert">
          {error}
        </p>
      )}

      {results.length === 0 ? (
        <p className={`paper ${styles.empty}`}>Nobody found.</p>
      ) : (
        <ul className={styles.list}>
          {results.map((p) => (
            <li
              key={p.id}
              className={styles.row}
              data-status={p.status}
              data-banned={p.banned}
            >
              <button
                type="button"
                className={styles.who}
                onClick={() => setSelectedId(p.id)}
              >
                <strong className={styles.name}>{p.full_name}</strong>
                {p.stage_name && (
                  <span className={styles.stage}>aka {p.stage_name}</span>
                )}
                <span className={styles.contact}>{p.email ?? p.phone}</span>
              </button>
              <div className={styles.badges}>
                {p.banned && <BannedBadge />}
                <StatusBadge status={p.status} />
                <RoleBadge role={p.role} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <PersonSheet
          person={selected}
          onClose={() => setSelectedId(null)}
          canBan={canBan}
          onBan={ban}
        />
      )}
    </div>
  );
}
