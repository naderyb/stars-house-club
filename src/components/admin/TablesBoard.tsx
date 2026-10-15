"use client";

import { useRouter } from "next/navigation";
import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { formatPrice } from "@/data/menu";
import {
  orderTotal,
  type AdminOrder,
  type AdminOrderItem,
  type AdminTable,
  type MenuChoice,
  type PaidOrder,
} from "@/lib/admin/orderTypes";
import { useAdminCall } from "./useAdminCall";
import ConfirmModal from "./ConfirmModal";
import formStyles from "@/components/JoinForm.module.css";
import extra from "./AdminExtras.module.css";
import styles from "./MenuManager.module.css";

interface Props {
  tables: AdminTable[];
  /** orders that are not paid yet */
  orders: AdminOrder[];
  paidToday: PaidOrder[];
  menu: MenuChoice[];
  todayTotal: number;
}

type TableStatus = "free" | "occupied" | "paid";
const STATUS_LABEL: Record<TableStatus, string> = {
  free: "Free",
  occupied: "Occupied",
  paid: "Paid",
};

/** "izem", "2 izem", "2x izem", "izem x2" -> { name, qty } */
function parseEntry(raw: string, menu: MenuChoice[]) {
  const s = raw.trim().replace(/\s+/g, " ");
  const exact = menu.find((m) => m.name.toLowerCase() === s.toLowerCase());
  if (exact) return { name: s, qty: 1 };

  const before = s.match(/^(\d{1,2})\s*[x×*]?\s+(.+)$/i);
  if (before) return { name: before[2], qty: Number(before[1]) };
  const after = s.match(/^(.+?)\s*[x×*]\s*(\d{1,2})$/i);
  if (after) return { name: after[1], qty: Number(after[2]) };
  return { name: s, qty: 1 };
}

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Algiers",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** items that were added on screen and are not saved yet have a temporary id */
const isTemp = (id: string) => id.startsWith("tmp-");
const tempId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Local copy of server data: changes show instantly, and it resets to the
 *  server's version every time the page data refreshes. */
function useSynced<T>(serverValue: T) {
  const [value, setValue] = useState(serverValue);
  const [previous, setPrevious] = useState(serverValue);
  if (previous !== serverValue) {
    setPrevious(serverValue);
    setValue(serverValue);
  }
  return [value, setValue] as const;
}

export default function TablesBoard({
  tables,
  orders,
  paidToday,
  menu,
  todayTotal,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { call, busy, error } = useAdminCall("/api/admin/orders");

  const [liveOrders, setLiveOrders] = useSynced(orders);
  const [livePaid, setLivePaid] = useSynced(paidToday);
  const [liveToday, setLiveToday] = useSynced(todayTotal);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState("");
  const [entry, setEntry] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [formError, setFormError] = useState("");
  const [queueError, setQueueError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    action: () => void;
  } | null>(null);
  const entryRef = useRef<HTMLInputElement>(null);

  /* ---------- saving in the background, one request at a time ---------- */
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(0);

  const enqueue = (body: Record<string, unknown>) => {
    pending.current += 1;
    setQueueError("");
    queue.current = queue.current.then(async () => {
      let ok = false;
      try {
        const res = await fetch("/api/admin/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);
        ok = res.ok;
        if (!ok) setQueueError(data?.message ?? "Something went wrong.");
      } catch {
        setQueueError("Network problem. Please try again.");
      }
      pending.current -= 1;
      // reload the real data when everything is saved, or right away on a failure
      if (!ok || pending.current === 0) startTransition(() => router.refresh());
    });
  };

  /* ---------- derived data ---------- */
  const ordersByTable = useMemo(() => {
    const map = new Map<string, AdminOrder>();
    for (const o of liveOrders) if (o.table_id) map.set(o.table_id, o);
    return map;
  }, [liveOrders]);

  const lastPaidByTable = useMemo(() => {
    const map = new Map<string, PaidOrder>();
    for (const p of livePaid) {
      if (p.table_id && !map.has(p.table_id)) map.set(p.table_id, p); // newest first
    }
    return map;
  }, [livePaid]);

  const statusOf = (tableId: string): TableStatus => {
    const o = ordersByTable.get(tableId);
    if (o && o.items.length > 0) return "occupied";
    return lastPaidByTable.has(tableId) ? "paid" : "free";
  };

  const selected = tables.find((t) => t.id === selectedId) ?? null;
  const order = selected ? (ordersByTable.get(selected.id) ?? null) : null;
  const items = order?.items ?? [];
  const total = orderTotal(items);
  const status = selected ? statusOf(selected.id) : "free";
  const lastPaid = selected ? lastPaidByTable.get(selected.id) : undefined;
  const syncing =
    !!order && (isTemp(order.id) || items.some((i) => isTemp(i.id)));

  // what is being typed, and whether it matches something on the menu
  const parsed = parseEntry(entry, menu);
  const match = menu.find(
    (m) => m.name.toLowerCase() === parsed.name.toLowerCase(),
  );
  const needsPrice = parsed.name.length > 0 && !match;

  /* ---------- actions ---------- */
  const addTable = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{1,3}$/.test(newNumber.trim()) || Number(newNumber) < 1) {
      setFormError("Enter the table number (1 or more).");
      return;
    }
    setFormError("");
    if (await call({ action: "addTable", number: Number(newNumber) }))
      setNewNumber("");
  };

  /** puts an item on the selected table: shows instantly, saves in the background */
  const addToTable = (name: string, price: number, qty: number) => {
    if (!selected) return;
    const table = selected;
    setFormError("");

    setLiveOrders((prev) => {
      const current = prev.find((o) => o.table_id === table.id);
      if (!current) {
        const fresh: AdminOrder = {
          id: tempId(),
          table_id: table.id,
          table_label: String(table.number),
          created_at: new Date().toISOString(),
          items: [{ id: tempId(), name, price, qty }],
        };
        return [...prev, fresh];
      }
      const same = current.items.find(
        (i) => i.name === name && i.price === price,
      );
      const nextItems: AdminOrderItem[] = same
        ? current.items.map((i) =>
            i === same ? { ...i, qty: Math.min(99, i.qty + qty) } : i,
          )
        : [...current.items, { id: tempId(), name, price, qty }];
      return prev.map((o) => (o === current ? { ...o, items: nextItems } : o));
    });

    enqueue({ action: "addItem", tableId: table.id, name, price, qty });
  };

  const addTyped = (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!parsed.name) return setFormError("Type what was ordered.");
    if (parsed.qty < 1) return setFormError("The quantity must be 1 or more.");

    let price = match?.price;
    if (price === undefined) {
      if (!/^\d{1,7}$/.test(customPrice.trim()))
        return setFormError(
          `"${parsed.name}" is not on the menu. Enter its price in DA.`,
        );
      price = Number(customPrice);
    }

    addToTable(match?.name ?? parsed.name, price, parsed.qty);
    setEntry("");
    setCustomPrice("");
    entryRef.current?.focus();
  };

  const changeQty = (item: AdminOrderItem, qty: number) => {
    if (!order || isTemp(item.id)) return;
    setLiveOrders((prev) =>
      prev.map((o) =>
        o.id !== order.id
          ? o
          : {
              ...o,
              items:
                qty === 0
                  ? o.items.filter((i) => i.id !== item.id)
                  : o.items.map((i) => (i.id === item.id ? { ...i, qty } : i)),
            },
      ),
    );
    enqueue({ action: "setQty", itemId: item.id, qty });
  };

  const pay = () => {
    if (!order || !selected || syncing) return;
    setConfirmation({
      title: "Mark order as paid?",
      message: `Table ${selected.number}: ${formatPrice(total)} will be added to today's sales.`,
      confirmLabel: "Mark as paid",
      action: () => {
        // the table switches to "Paid" and the money joins today's total right away
        setLiveOrders((prev) => prev.filter((o) => o.id !== order.id));
        setLivePaid((prev) => [
          {
            id: order.id,
            table_id: selected.id,
            table_label: String(selected.number),
            total,
            paid_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setLiveToday((t) => t + total);
        enqueue({ action: "pay", orderId: order.id });
      },
    });
  };

  const cancelOrder = () => {
    if (!order || !selected || syncing) return;
    setConfirmation({
      title: "Cancel this order?",
      message: `Cancel the whole order of table ${selected.number}? This cannot be undone.`,
      confirmLabel: "Cancel order",
      action: () => {
        setLiveOrders((prev) => prev.filter((o) => o.id !== order.id));
        enqueue({ action: "cancel", orderId: order.id });
      },
    });
  };

  const removeTable = () => {
    if (!selected) return;
    setConfirmation({
      title: "Remove this table?",
      message: `Remove table ${selected.number}? Past payments stay in your stats.`,
      confirmLabel: "Remove table",
      action: () => {
        call({ action: "deleteTable", id: selected.id }).then((ok) => {
          if (ok) setSelectedId(null);
        });
      },
    });
  };

  const shownError = error || queueError;

  return (
    <div className={styles.wrap}>
      {confirmation && (
        <ConfirmModal
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={confirmation.confirmLabel}
          busy={busy}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            confirmation.action();
            setConfirmation(null);
          }}
        />
      )}
      <div className={styles.top}>
        <h1 className={styles.title}>Tables</h1>
        <p className={extra.todayChip}>Today: {formatPrice(liveToday)}</p>
      </div>

      {shownError && (
        <p className={styles.error} role="alert">
          {shownError}
        </p>
      )}

      {/* ---- the tables ---- */}
      <section className={`paper ${styles.card}`} aria-label="Tables">
        {tables.length === 0 ? (
          <p>No tables yet. Add your first table number below.</p>
        ) : (
          <div className={extra.tiles}>
            {tables.map((t) => {
              const s = statusOf(t.id);
              const o = ordersByTable.get(t.id);
              const amount =
                s === "occupied"
                  ? orderTotal(o?.items ?? [])
                  : s === "paid"
                    ? (lastPaidByTable.get(t.id)?.total ?? 0)
                    : 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={extra.tile}
                  data-status={s}
                  aria-pressed={selectedId === t.id}
                  onClick={() => {
                    setSelectedId(selectedId === t.id ? null : t.id);
                    setFormError("");
                    setEntry("");
                    setCustomPrice("");
                  }}
                >
                  <span>Table</span>
                  <strong>{t.number}</strong>
                  <span className={extra.statusTag} data-status={s}>
                    {STATUS_LABEL[s]}
                  </span>
                  {s !== "free" && <span>{formatPrice(amount)}</span>}
                </button>
              );
            })}
          </div>
        )}

        <form className={extra.addTable} onSubmit={addTable} noValidate>
          <div className={formStyles.field}>
            <label htmlFor="new-table" className={formStyles.label}>
              New table number
            </label>
            <input
              id="new-table"
              className={formStyles.input}
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 7"
              maxLength={3}
              disabled={busy}
            />
          </div>
          <button
            type="submit"
            className={`btn btn--red ${styles.save}`}
            disabled={busy}
          >
            Add table
          </button>
        </form>
        {!selected && formError && (
          <p className={formStyles.error} role="alert">
            {formError}
          </p>
        )}
      </section>

      {/* ---- the selected table ---- */}
      {selected && (
        <section
          className={`paper ${styles.card}`}
          aria-label={`Table ${selected.number} order`}
        >
          <div className={extra.panelHead}>
            <h2 className={styles.catTitle}>
              Table {selected.number}{" "}
              <span className={extra.statusTag} data-status={status}>
                {STATUS_LABEL[status]}
              </span>
            </h2>
            {status !== "occupied" && (
              <button
                type="button"
                className={extra.smallBtn}
                onClick={removeTable}
                disabled={busy}
              >
                Remove this table
              </button>
            )}
          </div>

          {status === "paid" && lastPaid && (
            <p className={extra.paidBanner}>
              ✓ Paid {formatPrice(lastPaid.total)} at{" "}
              {timeFmt.format(new Date(lastPaid.paid_at))}. Tap an item below to
              start a new order for this table.
            </p>
          )}

          {items.length > 0 && (
            <ul className={extra.lines}>
              {items.map((i) => (
                <li key={i.id} className={extra.line}>
                  <span className={extra.lineName}>
                    {i.name} <small>{formatPrice(i.price)} each</small>
                  </span>
                  <span className={extra.lineTotal}>
                    {formatPrice(i.price * i.qty)}
                  </span>
                  <div className={extra.stepper}>
                    <button
                      type="button"
                      aria-label={
                        i.qty === 1 ? `Remove ${i.name}` : `One less ${i.name}`
                      }
                      onClick={() => changeQty(i, i.qty - 1)}
                      disabled={isTemp(i.id)}
                    >
                      −
                    </button>
                    <span aria-live="polite">{i.qty}</span>
                    <button
                      type="button"
                      aria-label={`One more ${i.name}`}
                      onClick={() => changeQty(i, i.qty + 1)}
                      disabled={isTemp(i.id) || i.qty >= 99}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* tap an item: it goes on this table */}
          <div className={extra.menuPicker}>
            <div className={extra.menuPickerHead}>
              <h3 className={extra.menuPickerTitle}>Menu</h3>
              <span className={extra.muted}>Tap an item to add it</span>
            </div>
            {menu.length === 0 ? (
              <p className={extra.muted}>
                No available menu items. Add items from the Menu page.
              </p>
            ) : (
              <div className={extra.menuChoices}>
                {menu.map((choice) => {
                  const inOrder = items
                    .filter(
                      (i) => i.name === choice.name && i.price === choice.price,
                    )
                    .reduce((sum, i) => sum + i.qty, 0);
                  return (
                    <button
                      key={`${choice.name}-${choice.price}`}
                      type="button"
                      className={extra.menuChoice}
                      data-picked={inOrder > 0}
                      onClick={() => addToTable(choice.name, choice.price, 1)}
                    >
                      <span>{choice.name}</span>
                      <strong>{formatPrice(choice.price)}</strong>
                      {inOrder > 0 && (
                        <em className={extra.menuChoiceQty}>×{inOrder}</em>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* or type what they ordered (handy for things not on the menu) */}
          <form className={extra.entry} onSubmit={addTyped} noValidate>
            <div className={formStyles.field}>
              <label htmlFor="order-entry" className={formStyles.label}>
                Or type it
              </label>
              <input
                id="order-entry"
                ref={entryRef}
                className={formStyles.input}
                list="menu-choices"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="e.g. izem, 2 tiramisu, latte x3"
                autoComplete="off"
                maxLength={80}
              />
              <datalist id="menu-choices">
                {menu.map((m) => (
                  <option key={m.name} value={m.name}>
                    {formatPrice(m.price)}
                  </option>
                ))}
              </datalist>
              {match && (
                <p className={formStyles.hint}>
                  {parsed.qty} × {match.name} ={" "}
                  {formatPrice(match.price * parsed.qty)}
                </p>
              )}
            </div>

            {needsPrice && (
              <div className={`${formStyles.field} ${extra.entryPrice}`}>
                <label htmlFor="order-price" className={formStyles.label}>
                  Price (DA) each
                </label>
                <input
                  id="order-price"
                  className={formStyles.input}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  inputMode="numeric"
                  placeholder="not on the menu"
                />
              </div>
            )}

            <button
              type="submit"
              className={`btn ${styles.save}`}
              disabled={!entry.trim()}
            >
              Add
            </button>
          </form>
          {formError && (
            <p className={formStyles.error} role="alert">
              {formError}
            </p>
          )}

          {items.length > 0 && (
            <>
              <div className={extra.totalBar}>
                <span className={formStyles.label}>Total to pay</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={`btn btn--red ${styles.save}`}
                  onClick={pay}
                  disabled={syncing}
                >
                  {syncing ? "Saving..." : "Mark as paid"}
                </button>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={cancelOrder}
                  disabled={syncing}
                >
                  Cancel order
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* ---- paid today, so a mistake can be undone ---- */}
      {livePaid.length > 0 && (
        <section className={`paper ${styles.card}`} aria-label="Paid today">
          <h2 className={styles.catTitle}>Paid today</h2>
          <ul className={extra.lines}>
            {livePaid.map((p) => (
              <li key={p.id} className={extra.paidRow}>
                <span>
                  <span className={extra.statusTag} data-status="paid">
                    Paid
                  </span>{" "}
                  {timeFmt.format(new Date(p.paid_at))} · Table {p.table_label}{" "}
                  · {formatPrice(p.total)}
                </span>
                <button
                  type="button"
                  className={extra.smallBtn}
                  onClick={() => {
                    setConfirmation({
                      title: "Reopen this order?",
                      message: `Reopen table ${p.table_label}'s order? It will leave today's total until you pay it again.`,
                      confirmLabel: "Reopen order",
                      action: () => enqueue({ action: "reopen", orderId: p.id }),
                    });
                  }}
                >
                  Reopen
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
