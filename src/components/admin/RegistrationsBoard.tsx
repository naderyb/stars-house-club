"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminRegistration, Role, Status } from "@/lib/admin/types";
import RegistrationCard from "./RegistrationCard";
import RegistrationSearchModal from "./RegistrationSearchModal";
import styles from "./RegistrationsBoard.module.css";

const TABS: { id: Status; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
];

export default function RegistrationsBoard({
  initial,
  canDecide,
  canViewId,
  canErase,
  canBan,
}: {
  initial: AdminRegistration[];
  canDecide: boolean;
  canViewId: boolean;
  canErase: boolean;
  canBan: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<Status>("pending");
  const [role, setRole] = useState<"all" | Role>("all");
  const [error, setError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const review = async (id: string, status: Status) => {
    setError("");
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
        keepalive: true,
      });
      if (!res.ok) throw new Error();
      // small delay so the WhatsApp tab opens before the card moves to another tab
      setTimeout(() => {
        setItems((list) =>
          list.map((r) => (r.id === id ? { ...r, status } : r)),
        );
      }, 300);
    } catch {
      setError(
        "Could not save the decision. Check your connection and try again.",
      );
    }
  };

  const erase = async (id: string) => {
    setError("");
    try {
      const res = await fetch("/api/admin/erase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setItems((list) =>
        list.map((r) => (r.id === id ? { ...r, has_id: false } : r)),
      );
    } catch {
      setError("Could not delete the ID. Please try again.");
    }
  };

  const ban = async (id: string, banned: boolean, reason: string) => {
    setError("");
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, banned, reason }),
      });
      if (!res.ok) throw new Error();
      setItems((list) =>
        list.map((r) =>
          r.id === id
            ? { ...r, banned, ban_reason: banned ? reason.trim() || null : null }
            : r,
        ),
      );
    } catch {
      setError("Could not save the ban. Please try again.");
    }
  };

  const inRole = items.filter((r) => role === "all" || r.role === role);
  const list = inRole.filter((r) => r.status === tab);

  const selectSearchResult = (registration: AdminRegistration) => {
    setTab(registration.status);
    setRole(registration.role);
    setSearchOpen(false);
    requestAnimationFrame(() => {
      document
        .getElementById(`registration-${registration.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className={styles.board}>
      <div className={styles.top}>
        <div className={styles.tabs} role="tablist" aria-label="Status">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={styles.tab}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span>{inRole.filter((r) => r.status === t.id).length}</span>
            </button>
          ))}
        </div>

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
            </button>
          ))}
          <button
            type="button"
            className={styles.search}
            onClick={() => setSearchOpen(true)}
          >
            Search
          </button>
          <button
            type="button"
            className={styles.refresh}
            onClick={() => router.refresh()}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {list.length === 0 ? (
        <p className={`paper ${styles.empty}`}>Nothing here.</p>
      ) : (
        <div className={styles.list}>
          {list.map((r) => (
            <RegistrationCard
              key={r.id}
              reg={r}
              onReview={review}
              canDecide={canDecide}
              canViewId={canViewId}
              canErase={canErase}
              onErase={erase}
              canBan={canBan}
              onBan={ban}
            />
          ))}
        </div>
      )}

      {searchOpen && (
        <RegistrationSearchModal
          registrations={items}
          onSelect={selectSearchResult}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
