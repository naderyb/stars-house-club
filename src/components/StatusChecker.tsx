"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { siteConfig } from "@/data/site";
import styles from "./StatusChecker.module.css";

type Status = "pending" | "accepted" | "rejected";
interface Result {
  role: "artist" | "visitor";
  status: Status;
}

const KEY = "shc_phone";
const ROLE = { artist: "Artist", visitor: "Visitor" } as const;

export default function StatusChecker() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const started = useRef(false);

  const check = async (value: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: value }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.message ?? "Something went wrong. Please try again.",
        );
      }
      setResults(data.results as Result[]);
      try {
        if (data.results.length > 0) localStorage.setItem(KEY, value);
      } catch {}
    } catch (err) {
      setResults(null);
      setError(
        err instanceof Error
          ? err.message
          : "Network problem. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // opened on the same phone that just registered? check right away, no typing
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let saved = "";
    try {
      saved = localStorage.getItem(KEY) ?? "";
    } catch {}
    if (saved) {
      setPhone(saved);
      check(saved);
    }
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!loading) check(phone);
  };

  const reset = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setResults(null);
    setError("");
    setPhone("");
  };

  return (
    <div className={styles.wrap}>
      {results === null ? (
        <form className={`paper ${styles.form}`} onSubmit={submit} noValidate>
          <label htmlFor="status-phone" className={styles.label}>
            Your phone number
          </label>
          <input
            id="status-phone"
            className={styles.input}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0555 12 34 56"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-describedby={error ? "status-error" : "status-hint"}
          />
          <p id="status-hint" className={styles.hint}>
            The same one you registered with.
          </p>
          {error && (
            <p id="status-error" className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className={`btn ${styles.go}`}
            disabled={loading || !phone.trim()}
          >
            {loading ? "Checking..." : "Check"}
          </button>
        </form>
      ) : (
        <>
          {results.length === 0 ? (
            <section
              className={`paper ${styles.result}`}
              data-status="none"
              aria-live="polite"
            >
              <p className={styles.icon} aria-hidden="true">
                humm...
              </p>
              <h2 className={styles.title}>We can&apos;t find this number</h2>
              <p>
                Check the digits, or just come by and we&apos;ll sort it out.
              </p>
            </section>
          ) : (
            results.map((r) => (
              <section
                key={r.role}
                className={`paper ${styles.result}`}
                data-status={r.status}
                aria-live="polite"
              >
                {results.length > 1 && (
                  <p className={styles.role}>{ROLE[r.role]}</p>
                )}

                {r.status === "accepted" && (
                  <>
                    <h2 className={styles.title}>You&apos;re in!</h2>
                    <p className={styles.big}>
                      Come by, we can&apos;t wait to see you!
                    </p>
                    <Link href="/visit" className="btn">
                      How to find us
                    </Link>
                  </>
                )}

                {r.status === "pending" && (
                  <>
                    <h2 className={styles.title}>Still being reviewed</h2>
                    <p className={styles.big}>
                      Check back after the next story is posted.
                    </p>
                  </>
                )}

                {r.status === "rejected" && (
                  <>
                    <h2 className={styles.title}>Not this time</h2>
                    <p className={styles.big}>
                      We&apos;re full for now. Keep shining, you can apply again
                      later.
                    </p>
                    {!siteConfig.joinPaused && (
                      <Link href="/join" className="btn">
                        Apply again
                      </Link>
                    )}
                  </>
                )}
              </section>
            ))
          )}

          <button type="button" className={styles.again} onClick={reset}>
            Check another number
          </button>
        </>
      )}
    </div>
  );
}
