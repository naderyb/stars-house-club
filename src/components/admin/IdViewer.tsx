"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./IdViewer.module.css";

interface Props {
  /** registration id */
  id: string;
  name: string;
}

/** "View ID" button + a popup with the picture. The link behind it lasts 2 minutes. */
export default function IdViewer({ id, name }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "open">("idle");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  const close = () => {
    setState("idle");
    setUrl("");
  };

  const open = async () => {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch(`/api/admin/id?id=${id}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMessage(data?.message ?? "Could not load the ID.");
        setState("idle");
        return;
      }
      setUrl(data.url);
      setState("open");
    } catch {
      setMessage("Network problem. Please try again.");
      setState("idle");
    }
  };

  useEffect(() => {
    if (state !== "open") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setState("idle");
        setUrl("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state]);

  return (
    <>
      <button
        type="button"
        className={styles.btn}
        onClick={open}
        disabled={state === "loading"}
      >
        {state === "loading" ? "Loading..." : "View ID"}
      </button>
      {message && (
        <p className={styles.err} role="alert">
          {message}
        </p>
      )}

      {state === "open" &&
        createPortal(
          <div
            className={styles.backdrop}
            role="presentation"
            onMouseDown={close}
          >
            <section
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-label={`National ID of ${name}`}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h2 className={styles.who}>{name}</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`National ID of ${name}`}
                className={styles.image}
              />
              <p className={styles.note}>
                Private. Please don&apos;t take a picture of this screen.
              </p>
              <button type="button" className={styles.close} onClick={close}>
                Close
              </button>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
