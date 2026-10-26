"use client";

import { useEffect, useState, type ReactNode } from "react";
import { buzz } from "@/lib/haptics";
import StatusChecker from "./StatusChecker";
import styles from "./JoinGate.module.css";

type Mode = "choose" | "register" | "status";

export default function JoinGate({ register }: { register: ReactNode }) {
  const [mode, setMode] = useState<Mode>("choose");

  // #status or a saved phone -> status door. Any other hash (#artist...) -> register door.
  useEffect(() => {
    const timer = setTimeout(() => {
      const hash = window.location.hash.slice(1);
      let saved = "";
      try {
        saved = localStorage.getItem("shc_phone") ?? "";
      } catch {}
      if (hash === "status") setMode("status");
      else if (hash) setMode("register");
      else if (saved) setMode("status");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const pick = (next: Mode) => {
    buzz();
    setMode(next);
    window.history.replaceState(null, "", `#${next}`);
  };

  return (
    <div className={styles.gate}>
      <div
        className={styles.doors}
        role="group"
        aria-label="What do you want to do?"
      >
        <button
          type="button"
          className={styles.door}
          aria-pressed={mode === "register"}
          onClick={() => pick("register")}
        >
          <strong className={styles.title}>Register</strong>
          <span className={styles.sub}>I want to join</span>
        </button>

        <button
          type="button"
          className={styles.door}
          aria-pressed={mode === "status"}
          onClick={() => pick("status")}
        >
          <strong className={styles.title}>Check my status</strong>
          <span className={styles.sub}>I already registered</span>
        </button>
      </div>

      {mode === "register" && register}

      {mode === "status" && (
        <div className={styles.narrow}>
          <StatusChecker />
        </div>
      )}
    </div>
  );
}
