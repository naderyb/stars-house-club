"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { formatPrice } from "@/data/menu";
import { buzz } from "@/lib/haptics";
import type { MenuChoice } from "@/lib/admin/orderTypes";
import styles from "./OrderPicker.module.css";

interface Props {
  menu: MenuChoice[];
  tabName: string;
  onAdd: (name: string, price: number, qty: number) => void;
  onClose: () => void;
}

/** Accents and capitals don't matter: "frappe" finds "Frappé" */
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const MOVE_LIMIT = 10; // px the finger may drift and still count as a tap
const SCROLL_PAUSE = 200; // ms after scrolling during which taps are ignored

export default function OrderPicker({ menu, tabName, onAdd, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const [added, setAdded] = useState<Record<string, number>>({});

  const touchStart = useRef({ x: 0, y: 0 });
  const lastScroll = useRef(0);

  const totalAdded = Object.values(added).reduce((a, b) => a + b, 0);

  /* ---------- lock the page behind, Esc closes ---------- */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  /* ---------- sections, in the menu's order ---------- */
  const sections = useMemo(() => {
    const map = new Map<string, MenuChoice[]>();
    for (const m of menu) {
      const title = m.section ?? "Menu";
      const list = map.get(title);
      if (list) list.push(m);
      else map.set(title, [m]);
    }
    return [...map.entries()].map(([title, items]) => ({ title, items }));
  }, [menu]);

  const q = norm(query);
  const visible = sections
    .map((s) => ({
      title: s.title,
      items: s.items.filter((i) =>
        q ? norm(i.name).includes(q) : section === "all" || section === s.title,
      ),
    }))
    .filter((s) => s.items.length > 0);

  /* ---------- tap guard: a scroll is never a tap ---------- */
  const tap = (fn: () => void) => (e: MouseEvent<HTMLElement>) => {
    const keyboard = e.detail === 0; // Enter / Space on a focused row
    if (!keyboard) {
      const moved = Math.hypot(
        e.clientX - touchStart.current.x,
        e.clientY - touchStart.current.y,
      );
      if (moved > MOVE_LIMIT) return;
      if (Date.now() - lastScroll.current < SCROLL_PAUSE) return;
    }
    fn();
  };

  const rememberTouch = (e: PointerEvent<HTMLElement>) => {
    touchStart.current = { x: e.clientX, y: e.clientY };
  };

  const add = (choice: MenuChoice) => {
    buzz(10);
    onAdd(choice.name, choice.price, 1);
    const key = `${choice.name}|${choice.price}`;
    setAdded((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
  };

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Add items to ${tabName}`}
    >
      <div className={styles.sheet}>
        <header className={styles.head}>
          <h2 className={styles.title}>
            Add to <span>{tabName}</span>
          </h2>
          <button type="button" className={styles.close} onClick={onClose}>
            Done
          </button>
        </header>

        <div className={styles.tools}>
          <input
            type="search"
            className={styles.search}
            placeholder="Search the menu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the menu"
            autoComplete="off"
            enterKeyHint="search"
          />

          <div className={styles.chips} role="group" aria-label="Menu sections">
            {["all", ...sections.map((s) => s.title)].map((s) => (
              <button
                key={s}
                type="button"
                className={styles.chip}
                aria-pressed={!q && section === s}
                onClick={() => {
                  setSection(s);
                  setQuery("");
                }}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        <div
          className={styles.list}
          onPointerDown={rememberTouch}
          onScroll={() => (lastScroll.current = Date.now())}
        >
          {visible.length === 0 && (
            <p className={styles.empty}>
              {menu.length === 0
                ? "No available menu items. Add items from the Menu page."
                : "Nothing found."}
            </p>
          )}

          {visible.map((s) => (
            <section key={s.title} className={styles.group}>
              <h3 className={styles.groupTitle}>{s.title}</h3>
              {s.items.map((c) => {
                const n = added[`${c.name}|${c.price}`] ?? 0;
                return (
                  <button
                    key={`${c.name}-${c.price}`}
                    type="button"
                    className={styles.item}
                    data-picked={n > 0}
                    onClick={tap(() => add(c))}
                  >
                    <span className={styles.itemName}>{c.name}</span>
                    <span className={styles.itemPrice}>
                      {formatPrice(c.price)}
                    </span>
                    {n > 0 && <em className={styles.badge}>+{n}</em>}
                  </button>
                );
              })}
            </section>
          ))}
        </div>

        <footer className={styles.foot}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            {totalAdded > 0 ? `Done · ${totalAdded} added` : "Close"}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
