"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { formatPrice } from "@/data/menu";
import type { MenuChoice } from "@/lib/admin/orderTypes";
import { CAN, type Role } from "@/lib/admin/roles";
import {
  lineTotal,
  paidTotal,
  unpaidTotal,
  type ClosedTab,
  type Tab,
  type TabItem,
} from "@/lib/admin/tabTypes";
import ConfirmModal from "./ConfirmModal";
import OrderPicker from "./OrderPicker";
import formStyles from "@/components/JoinForm.module.css";
import extra from "./AdminExtras.module.css";
import styles from "./MenuManager.module.css";
import tabStyles from "./TabsBoard.module.css";

interface Props {
  tabs: Tab[];
  /** quick-pick menu: only loaded for waiter and admin */
  menu: MenuChoice[];
  role: Role;
  /** admin only */
  recentlyPaid: ClosedTab[];
  /** admin only: null for everybody else */
  todayTotal: number | null;
}

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Algiers",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const PAGE_SIZE = 8;

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

type PayFilter = "all" | "unpaid" | "paid";
type SortMode = "newest" | "oldest" | "az";

const tabState = (t: Tab) =>
  t.items.length === 0 ? "empty" : unpaidTotal(t.items) > 0 ? "owed" : "paid";

const hasPaidItems = (t: Tab) => t.items.some((item) => item.paid_at !== null);

interface Confirmation {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => void;
}

export default function TabsBoard({
  tabs,
  menu,
  role,  
  recentlyPaid,
  todayTotal,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const allowed = (list: readonly Role[]) => list.includes(role);
  const canTake = allowed(CAN.takeOrders);
  const canPay = allowed(CAN.pay);
  const isAdmin = role === "admin";
  const canUndoItem = isAdmin || role === "cashier";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [picking, setPicking] = useState(false);
  const [page, setPage] = useState(0);
  const [tabQuery, setTabQuery] = useState("");
  const [payFilter, setPayFilter] = useState<PayFilter>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [formError, setFormError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [payPart, setPayPart] = useState<{
    tabId: string;
    quantities: Record<string, number>;
  } | null>(null);

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  /* ---------- saving: one request at a time, in the order they were tapped ---------- */
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);

  /** resolves with the server's answer, or null when it failed */
  const send = (body: Record<string, unknown>) => {
    pending.current += 1;
    setSaving(true);
    setError("");

    const run = queue.current.then(async () => {
      let result: Record<string, unknown> | null = null;
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 15_000);
      try {
        const res = await fetch("/api/admin/tabs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);
        if (res.ok) result = data ?? {};
        else setError(data?.message ?? "Something went wrong.");
      } catch (err) {
        setError(
          err instanceof DOMException && err.name === "AbortError"
            ? "The connection is too slow. Your last tap may not have been saved: check the tab."
            : "Network problem. Please try again.",
        );
      } finally {
        window.clearTimeout(timer);
      }
      pending.current -= 1;
      if (pending.current === 0) setSaving(false);
      // show the real data once everything is saved, or right away on a failure
      if (!result || pending.current === 0) {
        startTransition(() => router.refresh());
      }
      return result;
    });
    queue.current = run;
    return run;
  };

  /* ---------- keep every screen fresh (waiter's phone, cashier's tablet...) ---------- */
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && pending.current === 0) {
        startTransition(() => router.refresh());
      }
    };
    const id = window.setInterval(refresh, 12_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);

  /* ---------- derived ---------- */
  const tabIds = new Set(tabs.map((t) => t.id));
  const q = norm(tabQuery.trim());
  // two people can share a name: add the opening time wherever the name shows
  const nameCount = new Map<string, number>();
  for (const t of tabs) {
    const key = norm(t.name.trim());
    nameCount.set(key, (nameCount.get(key) ?? 0) + 1);
  }
  const label = (t: Tab) =>
    (nameCount.get(norm(t.name.trim())) ?? 0) > 1
      ? `${t.name} · ${timeFmt.format(new Date(t.created_at))}`
      : t.name;

  const unpaidCount = tabs.filter((t) => tabState(t) === "owed").length;
  const paidCount = tabs.filter(hasPaidItems).length;

  const filteredTabs = [...tabs]
    .filter((t) => {
      if (payFilter === "unpaid" && tabState(t) !== "owed") return false;
      if (payFilter === "paid" && !hasPaidItems(t)) return false;
      return !q || norm(t.name).includes(q);
    })
    .sort((a, b) =>
      sort === "az"
        ? a.name.localeCompare(b.name, "fr", { sensitivity: "base" }) ||
          a.created_at.localeCompare(b.created_at)
        : sort === "oldest"
          ? a.created_at.localeCompare(b.created_at)
          : b.created_at.localeCompare(a.created_at),
    );
  const typedName = newName.trim();
  const nameTaken =
    typedName.length > 0 &&
    tabs.some((t) => norm(t.name.trim()) === norm(typedName));
  const pageCount = Math.max(1, Math.ceil(filteredTabs.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageTabs = filteredTabs.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const selected = tabs.find((t) => t.id === selectedId) ?? null;
  const checkedIds = checked.filter((id) => tabIds.has(id));
  const checkedTabs = tabs.filter((t) => checkedIds.includes(t.id));
  const checkedTotal = checkedTabs.reduce(
    (sum, t) => sum + unpaidTotal(t.items),
    0,
  );

  const owed = selected ? unpaidTotal(selected.items) : 0;
  const alreadyPaid = selected ? paidTotal(selected.items) : 0;
  const hasPaidLines = !!selected?.items.some((i) => i.paid_at);
  const payingPartItems = Object.entries(payPart?.quantities ?? {}).filter(
    ([, qty]) => qty > 0,
  );
  const payingPartQty = payingPartItems.reduce((sum, [, qty]) => sum + qty, 0);
  const payingPartTotal = payingPartItems.reduce((sum, [itemId, qty]) => {
    const item = selected?.items.find((candidate) => candidate.id === itemId);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  /* ---------- actions ---------- */
  const openTab = async (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return setFormError("Type a name for the tab.");
    setFormError("");
    const res = await send({ action: "openTab", name });
    if (res) {
      setNewName("");
      setTabQuery("");
      setPayFilter("all");
      setSort("newest");
      setPage(0);
      if (typeof res.id === "string") setSelectedId(res.id);
    }
  };

  const addItem = (tab: Tab, name: string, price: number, qty: number) => {
    setFormError("");
    send({ action: "addItem", tabId: tab.id, name, price, qty });
  };

  const changeQty = (item: TabItem, qty: number) => {
    send({ action: "setQty", itemId: item.id, qty });
  };

  const submitRename = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const name = renameValue.trim();
    if (!name) return;
    if (await send({ action: "renameTab", tabId: selected.id, name })) {
      setRenaming(false);
    }
  };

  const deleteTab = (tab: Tab) => {
    setConfirmation({
      title: `Delete ${label(tab)}'s tab?`,
      message: "Everything on it is removed. This can't be undone.",
      confirmLabel: "Delete tab",
      action: () => {
        send({ action: "deleteTab", tabId: tab.id }).then((ok) => {
          if (ok) setSelectedId(null);
        });
      },
    });
  };

  const payTabs = (list: Tab[]) => {
    const total = list.reduce((sum, t) => sum + unpaidTotal(t.items), 0);
    if (total <= 0) return setError("Nothing to pay on that tab yet.");
    const names = list.map(label).join(", ");
    setConfirmation({
      title:
        list.length === 1 ? "Mark tab as paid?" : "Pay these tabs together?",
      message: `${names}: ${formatPrice(total)} will be paid and the tab${list.length === 1 ? "" : "s"} closed.`,
      confirmLabel: "Mark as paid",
      action: () => {
        const ids = list.map((t) => t.id);
        send({ action: "payTabs", tabIds: ids }).then((ok) => {
          if (!ok) return;
          setChecked((prev) => prev.filter((id) => !ids.includes(id)));
          setSelectedId((id) => (id && ids.includes(id) ? null : id));
        });
      },
    });
  };

  const payItem = (tab: Tab, item: TabItem) => {
    setConfirmation({
      title: "Mark this item as paid?",
      message: `${label(tab)}: ${item.qty > 1 ? `${item.qty} × ` : ""}${item.name}, ${formatPrice(lineTotal(item))}. The tab stays open.`,
      confirmLabel: "Mark as paid",
      action: () => {
        send({ action: "payItems", itemIds: [item.id] });
      },
    });
  };

  const startPayPart = (tab: Tab, item?: TabItem) => {
    const quantities: Record<string, number> = {};
    if (item) quantities[item.id] = 1;
    setPayPart({ tabId: tab.id, quantities });
  };

  const setPartQty = (item: TabItem, qty: number) => {
    setPayPart((current) => {
      if (!current) return current;
      const quantities = { ...current.quantities };
      if (qty > 0) quantities[item.id] = Math.min(item.qty, qty);
      else delete quantities[item.id];
      return { ...current, quantities };
    });
  };

  const paySelectedPart = (tab: Tab) => {
    const items = Object.entries(payPart?.quantities ?? {})
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ itemId, qty }));
    if (items.length === 0) {
      setError("Choose at least one item to pay.");
      return;
    }
    const total = items.reduce((sum, entry) => {
      const item = tab.items.find((candidate) => candidate.id === entry.itemId);
      return sum + (item ? item.price * entry.qty : 0);
    }, 0);
    setConfirmation({
      title: "Mark selected items as paid?",
      message: `${label(tab)}: ${formatPrice(total)} will be paid. The tab stays open.`,
      confirmLabel: "Mark as paid",
      action: () => {
        send({ action: "payPart", tabId: tab.id, items }).then((ok) => {
          if (ok) setPayPart(null);
        });
      },
    });
  };

  const closeTab = (tab: Tab) => {
    send({ action: "closeTab", tabId: tab.id }).then((ok) => {
      if (ok) setSelectedId(null);
    });
  };

  const undoPay = (tab: ClosedTab) => {
    setConfirmation({
      title: "Undo this payment?",
      message: `${tab.name}'s tab (${formatPrice(tab.total)}) is reopened and leaves today's earnings until it's paid again.`,
      confirmLabel: "Undo payment",
      action: () => {
        send({ action: "undoPay", tabId: tab.id });
      },
    });
  };

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const shownError = error;

  return (
    <div className={styles.wrap}>
      {confirmation && (
        <ConfirmModal
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={confirmation.confirmLabel}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            confirmation.action();
            setConfirmation(null);
          }}
        />
      )}

      <div className={styles.top}>
        <h1 className={styles.title}>Orders</h1>
        {isAdmin && todayTotal !== null && (
          <p className={extra.todayChip}>Today: {formatPrice(todayTotal)}</p>
        )}
      </div>

      {shownError && (
        <p className={styles.error} role="alert">
          {shownError}
        </p>
      )}
      {saving && <p className={extra.muted}>Saving...</p>}

      {/* ---- open tabs ---- */}
      <section className={`paper ${styles.card}`} aria-label="Open tabs">
        <h2 className={styles.catTitle}>Open tabs</h2>
                {canPay && tabs.length > 0 && (
          <p className={tabStyles.sub}>
            Someone paying for friends? Tick the circle on each of their tabs, then
            press <strong>Pay together</strong>.
          </p>
        )}

        {tabs.length === 0 ? (
          <p>
            No open tabs.{" "}
            {canTake
              ? "Open one below when someone orders."
              : "Nothing to pay right now."}
          </p>
        ) : (
          <>
            <div
              className={tabStyles.filters}
              role="group"
              aria-label="Filter tabs"
            >
              {(
                [
                  ["all", "All", tabs.length],
                  ["unpaid", "Unpaid", unpaidCount],
                  ["paid", "Paid", paidCount],
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  className={tabStyles.filter}
                  aria-pressed={payFilter === key}
                  onClick={() => {
                    setPayFilter(key);
                    setPage(0);
                  }}
                >
                  {label} <span>{count}</span>
                </button>
              ))}
            </div>

            <div className={tabStyles.searchRow}>
              <input
                type="search"
                className={tabStyles.tabSearch}
                placeholder="Find a tab by name..."
                value={tabQuery}
                onChange={(e) => {
                  setTabQuery(e.target.value);
                  setPage(0);
                }}
                aria-label="Find a tab by name"
                autoComplete="off"
              />
              <select
                className={tabStyles.sort}
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortMode);
                  setPage(0);
                }}
                aria-label="Sort tabs"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="az">A → Z</option>
              </select>
            </div>

            {filteredTabs.length === 0 && (
              <p className={tabStyles.sub}>Nothing to show with this filter.</p>
            )}

            <div className={tabStyles.tabGrid}>
              {pageTabs.map((t) => {
                const tabOwed = unpaidTotal(t.items);
                const state = tabState(t);
                return (
                  <div
                    key={t.id}
                    className={tabStyles.tab}
                    data-state={state}
                    data-selected={selectedId === t.id}
                  >
                    {canPay && (
                      <label className={tabStyles.check}>
                        <input
                          type="checkbox"
                          checked={checkedIds.includes(t.id)}
                          onChange={() =>
                            setChecked((prev) => toggle(prev, t.id))
                          }
                          aria-label={`Select ${label(t)} to pay`}
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      className={tabStyles.tabMain}
                      aria-pressed={selectedId === t.id}
                      onClick={() => {
                        setSelectedId(selectedId === t.id ? null : t.id);
                        setRenaming(false);
                        setFormError("");
                        setPicking(false);
                        setPayPart(null);
                      }}
                    >
                    <span
                      className={extra.statusTag}
                      data-status={state}
                      aria-label={`Status: ${state}`}
                    >
                      {state === "owed"
                        ? "Owed"
                        : state === "paid"
                          ? "Paid"
                          : "Empty"}
                    </span>
                    <strong>{label(t)}</strong>
                      <span>
                        {state === "owed"
                          ? formatPrice(tabOwed)
                          : state === "paid"
                            ? "All paid"
                            : "Empty"}
                      </span>
                      <small>
                        since {timeFmt.format(new Date(t.created_at))}
                      </small>
                    </button>
                  </div>
                );
              })}
            </div>

            {pageCount > 1 && (
              <nav className={tabStyles.pager} aria-label="Tab pages">
                <button
                  type="button"
                  className={extra.smallBtn}
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  ← Newer
                </button>
                <span>
                  Page {currentPage + 1} of {pageCount}
                </span>
                <button
                  type="button"
                  className={extra.smallBtn}
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= pageCount - 1}
                >
                  Older →
                </button>
              </nav>
            )}
          </>
        )}

        {canTake && (
          <form className={extra.addTable} onSubmit={openTab} noValidate>
            <div className={formStyles.field}>
              <label htmlFor="new-tab" className={formStyles.label}>
                New tab (a first name or nickname)
              </label>
              <input
                id="new-tab"
                className={formStyles.input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. nader"
                maxLength={40}
                autoComplete="off"
              />
              {nameTaken && (
                <p className={formStyles.hint}>
                  A tab named &quot;{typedName}&quot; is already open. You can
                  still open this one, and both will show their opening time.
                  Or add a detail, like &quot;{typedName} K.&quot;
                </p>
              )}
            </div>
            <button type="submit" className={`btn btn--red ${styles.save}`}>
              Open tab
            </button>
          </form>
        )}
        {!selected && formError && (
          <p className={formStyles.error} role="alert">
            {formError}
          </p>
        )}
      </section>

      {/* ---- pay several tabs together ---- */}
      {canPay && checkedTabs.length > 0 && (
        <div className={tabStyles.payBar} role="status">
          <span>
            <strong>{formatPrice(checkedTotal)}</strong>{" "}
            <span className={tabStyles.sub}>
              · {checkedTabs.length} tab{checkedTabs.length === 1 ? "" : "s"}
            </span>
          </span>
          <div className={tabStyles.payBarActions}>
            <button
              type="button"
              className={`btn btn--red ${styles.save}`}
              onClick={() => payTabs(checkedTabs)}
            >
              {checkedTabs.length === 1 ? "Pay" : "Pay together"}
            </button>
            <button
              type="button"
              className={extra.smallBtn}
              onClick={() => setChecked([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ---- the selected tab ---- */}
      {selected && (
        <section
          className={`paper ${styles.card}`}
          aria-label={`${label(selected)}'s tab`}
        >
          <div className={extra.panelHead}>
            <h2 className={styles.catTitle}>{label(selected)}</h2>
            {canTake && (
              <div className={tabStyles.headTools}>
                <button
                  type="button"
                  className={extra.smallBtn}
                  onClick={() => {
                    setRenameValue(selected.name);
                    setRenaming(!renaming);
                  }}
                >
                  Rename
                </button>
                {!hasPaidLines && (
                  <button
                    type="button"
                    className={extra.smallBtn}
                    onClick={() => deleteTab(selected)}
                  >
                    Delete tab
                  </button>
                )}
              </div>
            )}
          </div>

          {renaming && (
            <form
              className={tabStyles.rename}
              onSubmit={submitRename}
              noValidate
            >
              <div className={formStyles.field}>
                <label htmlFor="rename-tab" className={formStyles.label}>
                  New name
                </label>
                <input
                  id="rename-tab"
                  className={formStyles.input}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  maxLength={40}
                  autoFocus
                />
              </div>
              <button type="submit" className={`btn ${styles.save}`}>
                Save
              </button>
            </form>
          )}

          {selected.items.length === 0 ? (
            <p className={tabStyles.sub}>Nothing on this tab yet.</p>
          ) : (
            <ul className={extra.lines}>
              {selected.items
                .filter((i) => !i.paid_at)
                .map((i) => (
                  <li key={i.id} className={extra.line}>
                    <span className={extra.lineName}>
                      {i.name}
                      <small>
                        {formatPrice(i.price)}
                        {i.qty > 1 ? ` each × ${i.qty}` : ""}
                        {" · "}
                        {timeFmt.format(new Date(i.created_at))}
                      </small>
                    </span>
                    <span className={extra.lineTotal}>
                      {formatPrice(lineTotal(i))}
                    </span>

                    {(canTake || canPay) && (
                      <div className={tabStyles.lineActions}>
                        {canPay && (
                          <button
                            type="button"
                            className={extra.smallBtn}
                            onClick={() =>
                              i.qty === 1
                                ? payItem(selected, i)
                                : startPayPart(selected, i)
                            }
                          >
                            {i.qty === 1 ? "Pay this" : "Pay part"}
                          </button>
                        )}
                        {canPay && payPart?.tabId === selected.id && (
                          <div className={tabStyles.partStepper}>
                            <button
                              type="button"
                              aria-label={`Pay one less ${i.name}`}
                              onClick={() =>
                                setPartQty(
                                  i,
                                  (payPart.quantities[i.id] ?? 0) - 1,
                                )
                              }
                            >
                              −
                            </button>
                            <span aria-live="polite">
                              {payPart.quantities[i.id] ?? 0} of {i.qty}
                            </span>
                            <button
                              type="button"
                              aria-label={`Pay one more ${i.name}`}
                              onClick={() =>
                                setPartQty(
                                  i,
                                  (payPart.quantities[i.id] ?? 0) + 1,
                                )
                              }
                              disabled={
                                (payPart.quantities[i.id] ?? 0) >= i.qty
                              }
                            >
                              +
                            </button>
                          </div>
                        )}
                        {canTake && (
                          <div className={extra.stepper}>
                            <button
                              type="button"
                              aria-label={
                                i.qty === 1
                                  ? `Remove ${i.name}`
                                  : `One less ${i.name}`
                              }
                              onClick={() => changeQty(i, i.qty - 1)}
                            >
                              −
                            </button>
                            <span aria-live="polite">{i.qty}</span>
                            <button
                              type="button"
                              aria-label={`One more ${i.name}`}
                              onClick={() => changeQty(i, i.qty + 1)}
                              disabled={i.qty >= 99}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              {hasPaidLines && (
                <li className={`${extra.line} ${tabStyles.paidLine}`}>
                  <span className={extra.lineName}>
                    Already paid ·{" "}
                    {selected.items.filter((i) => i.paid_at).length} lines ·{" "}
                    {formatPrice(alreadyPaid)}
                  </span>
                  {canUndoItem && (
                    <div className={tabStyles.lineActions}>
                      {selected.items
                        .filter((i) => i.paid_at)
                        .map((i) => (
                          <button
                            key={i.id}
                            type="button"
                            className={extra.smallBtn}
                            onClick={() =>
                              setConfirmation({
                                title: "Undo this payment?",
                                message: `${i.name}: ${formatPrice(
                                  lineTotal(i),
                                )} will be added back to the unpaid items.`,
                                confirmLabel: "Undo",
                                action: () =>
                                  send({
                                    action: "undoItem",
                                    itemId: i.id,
                                  }),
                              })
                            }
                          >
                            Undo {i.name}
                          </button>
                        ))}
                    </div>
                  )}
                </li>
              )}
            </ul>
          )}

          {/* waiter / admin: one big button opens the search-and-select picker */}
          {canTake && (
            <button
              type="button"
              className={`btn btn--red ${tabStyles.addItems}`}
              onClick={() => setPicking(true)}
            >
              + Add items
            </button>
          )}

          {/* totals + pay / close */}
          {selected.items.length > 0 && (
            <div className={extra.totalBar}>
              <span>
                <span className={formStyles.label}>Still to pay</span>
                {alreadyPaid > 0 && (
                  <span className={tabStyles.sub}>
                    {" "}
                    · already paid {formatPrice(alreadyPaid)}
                  </span>
                )}
              </span>
              <strong>{formatPrice(owed)}</strong>
            </div>
          )}

          {canPay && (
            <div className={styles.formActions}>
              {payPart?.tabId === selected.id && (
                <div className={tabStyles.partBar} role="status">
                  <span>
                    <strong>
                      {payingPartQty > 0
                        ? `Paying now: ${payingPartQty} item${
                            payingPartQty === 1 ? "" : "s"
                          } · ${formatPrice(payingPartTotal)}`
                        : "Choose items"}
                    </strong>
                  </span>
                  <button
                    type="button"
                    className={`btn btn--red ${styles.save}`}
                    onClick={() => paySelectedPart(selected)}
                  >
                    Mark as paid
                  </button>
                  <button
                    type="button"
                    className={extra.smallBtn}
                    onClick={() => setPayPart(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {owed > 0 ? (
                <button
                  type="button"
                  className={`btn btn--red ${styles.save}`}
                  onClick={() => payTabs([selected])}
                >
                  Mark tab as paid
                </button>
              ) : (
                <button
                  type="button"
                  className={`btn ${styles.save}`}
                  onClick={() => closeTab(selected)}
                >
                  {selected.items.length === 0
                    ? "Close empty tab"
                    : "Close tab (all paid)"}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {picking && selected && canTake && (
        <OrderPicker
          menu={menu}
          tabName={label(selected)}
          onAdd={(name, price, qty) => addItem(selected, name, price, qty)}
          onClose={() => setPicking(false)}
        />
      )}

      {/* ---- admin only: today's settled tabs, to undo a mistake ---- */}
      {isAdmin && recentlyPaid.length > 0 && (
        <section className={`paper ${styles.card}`} aria-label="Recently paid">
          <h2 className={styles.catTitle}>Recently paid</h2>
          <ul className={extra.lines}>
            {recentlyPaid.map((p) => (
              <li key={p.id} className={extra.paidRow}>
                <span>
                  <span className={extra.statusTag} data-status="paid">
                    Paid
                  </span>{" "}
                  {timeFmt.format(new Date(p.closed_at))} · {p.name} ·{" "}
                  {formatPrice(p.total)}
                </span>
                <button
                  type="button"
                  className={extra.smallBtn}
                  onClick={() => undoPay(p)}
                >
                  Undo
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
