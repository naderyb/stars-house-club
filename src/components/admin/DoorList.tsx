"use client";

import { useMemo, useState } from "react";
import type { DoorPerson, Role } from "@/lib/admin/types";
import { BannedBadge } from "./BanParts";
import DoorSearchModal from "./DoorSearchModal";
import PersonSheet from "./PersonSheet";
import { RoleBadge, StatusBadge } from "./StatusBadge";
import styles from "./DoorList.module.css";

type Filter = "all" | Role | "banned";

const LABELS: Record<Filter, string> = {
  all: "Everyone",
  artist: "Artists",
  visitor: "Visitors",
  banned: "Banned",
};

/** how many rows are drawn at once: keeps the page light on cheap phones */
const PAGE = 40;

export default function DoorList({
  people: initial,
  canBan,
}: {
  people: DoorPerson[];
  canBan: boolean;
}) {
  const [people, setPeople] = useState(initial);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(PAGE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const selected = people.find((p) => p.id === selectedId) ?? null;

  // one pass over everyone for the four chip counts
  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: people.length,
      artist: 0,
      visitor: 0,
      banned: 0,
    };
    for (const p of people) {
      c[p.role] += 1;
      if (p.banned) c.banned += 1;
    }
    return c;
  }, [people]);

  const results = useMemo(
    () =>
      people.filter((p) =>
        filter === "all"
          ? true
          : filter === "banned"
            ? p.banned
            : p.role === filter,
      ),
    [people, filter],
  );

  const shown = results.slice(0, limit);

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
            ? {
                ...p,
                banned,
                ban_reason: banned ? reason.trim() || null : null,
              }
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
        <button
          type="button"
          className={styles.search}
          onClick={() => setSearchOpen(true)}
        >
          Search
        </button>

        <div className={styles.chips}>
          {(["all", "artist", "visitor", "banned"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={styles.chip}
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f);
                setLimit(PAGE);
              }}
            >
              {LABELS[f]}
              <span>{counts[f]}</span>
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
          {shown.map((p) => (
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

      {results.length > limit && (
        <button
          type="button"
          className={styles.more}
          onClick={() => setLimit((n) => n + PAGE)}
        >
          Show more ({results.length - limit} left)
        </button>
      )}

      {selected && (
        <PersonSheet
          person={selected}
          onClose={() => setSelectedId(null)}
          canBan={canBan}
          onBan={ban}
        />
      )}

      {searchOpen && (
        <DoorSearchModal
          people={people}
          onSelect={(person) => {
            setSelectedId(person.id);
            setSearchOpen(false);
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
