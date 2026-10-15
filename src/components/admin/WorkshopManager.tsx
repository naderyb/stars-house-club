"use client";

import { useState } from "react";
import { formatPrice } from "@/data/menu";
import type {
  AdminWorkshop,
  AdminWorkshopOption,
} from "@/lib/admin/workshopTypes";
import {
  OptionForm,
  WorkshopForm,
  type OptionValues,
  type WorkshopValues,
} from "./WorkshopForms";
import { useAdminCall } from "./useAdminCall";
import styles from "./MenuManager.module.css";
import ConfirmModal from "./ConfirmModal";

type Editing =
  | { kind: "workshop"; id: string | null }
  | { kind: "option"; id: string | null; workshopId: string }
  | null;

interface Props {
  workshops: AdminWorkshop[];
  options: AdminWorkshopOption[];
}

export default function WorkshopManager({ workshops, options }: Props) {
  const { call, busy, error } = useAdminCall("/api/admin/workshops");
  const [editing, setEditing] = useState<Editing>(null);
  const [confirming, setConfirming] = useState<{
    title: string;
    message: string;
    action: Record<string, unknown>;
  } | null>(null);

  const saveWorkshop = async (id: string | null, v: WorkshopValues) => {
    if (await call({ action: "saveWorkshop", id: id ?? undefined, ...v }))
      setEditing(null);
  };

  const saveOption = async (
    id: string | null,
    workshopId: string,
    v: OptionValues,
  ) => {
    const ok = await call({
      action: "saveOption",
      id: id ?? undefined,
      workshopId,
      name: v.name,
      note: v.note,
      price: Number(v.price),
      addOn: v.addOn,
    });
    if (ok) setEditing(null);
  };

  const removeWorkshop = (w: AdminWorkshop, count: number) => {
    const msg =
      count > 0
        ? `Delete "${w.title}" and its ${count} option${count > 1 ? "s" : ""}? This can't be undone.`
        : `Delete "${w.title}"?`;
    setConfirming({
      title: "Delete workshop?",
      message: msg,
      action: { action: "deleteWorkshop", id: w.id },
    });
  };

  const removeOption = (o: AdminWorkshopOption) => {
    setConfirming({
      title: "Delete workshop option?",
      message: `Delete "${o.name}"? This can't be undone.`,
      action: { action: "deleteOption", id: o.id },
    });
  };

  const isEditing = (kind: "workshop" | "option", id: string | null) =>
    editing?.kind === kind && editing.id === id;

  return (
    <div className={styles.wrap}>
      {confirming && (
        <ConfirmModal
          title={confirming.title}
          message={confirming.message}
          confirmLabel="Delete"
          busy={busy}
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            if (await call(confirming.action)) setConfirming(null);
          }}
        />
      )}
      <div className={styles.top}>
        <h1 className={styles.title}>Workshops</h1>
        <button
          type="button"
          className={styles.add}
          onClick={() => setEditing({ kind: "workshop", id: null })}
          disabled={busy}
        >
          + Add workshop
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {isEditing("workshop", null) && (
        <div className={`paper ${styles.card}`}>
          <h2 className={styles.formTitle}>New workshop</h2>
          <WorkshopForm
            busy={busy}
            onSave={(v) => saveWorkshop(null, v)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {workshops.length === 0 && !isEditing("workshop", null) && (
        <p className={`paper ${styles.empty}`}>
          No workshops yet. Add your first one.
        </p>
      )}

      {workshops.map((w, wi) => {
        const wOptions = options.filter((o) => o.workshop_id === w.id);

        return (
          <section
            key={w.id}
            className={`paper ${styles.card}`}
            aria-label={w.title}
          >
            {isEditing("workshop", w.id) ? (
              <>
                <h2 className={styles.formTitle}>Edit workshop</h2>
                <WorkshopForm
                  initial={{
                    title: w.title,
                    ar: w.ar ?? "",
                    blurb: w.blurb,
                    materials: w.materials ?? "",
                    visible: w.visible,
                  }}
                  busy={busy}
                  onSave={(v) => saveWorkshop(w.id, v)}
                  onCancel={() => setEditing(null)}
                />
              </>
            ) : (
              <header className={styles.catHead}>
                <div className={styles.catInfo}>
                  <h2 className={styles.catTitle}>
                    {w.title}
                    {w.ar && (
                      <small lang="ar" dir="rtl">
                        {" "}
                        {w.ar}
                      </small>
                    )}
                  </h2>
                  <div className={styles.tags}>
                    {!w.visible && <span className={styles.tag}>Hidden</span>}
                    {w.materials && (
                      <span className={styles.tag}>{w.materials}</span>
                    )}
                    <span className={styles.tag}>
                      {wOptions.length} option{wOptions.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {w.blurb && <p>{w.blurb}</p>}
                </div>

                <div className={styles.tools}>
                  <button
                    type="button"
                    className={styles.toggle}
                    aria-pressed={w.visible}
                    onClick={() =>
                      call({
                        action: "setVisible",
                        id: w.id,
                        visible: !w.visible,
                      })
                    }
                    disabled={busy}
                  >
                    {w.visible ? "Visible" : "Hidden"}
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${w.title} up`}
                    disabled={busy || wi === 0}
                    onClick={() =>
                      call({
                        action: "move",
                        kind: "workshop",
                        id: w.id,
                        dir: "up",
                      })
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${w.title} down`}
                    disabled={busy || wi === workshops.length - 1}
                    onClick={() =>
                      call({
                        action: "move",
                        kind: "workshop",
                        id: w.id,
                        dir: "down",
                      })
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing({ kind: "workshop", id: w.id })}
                    disabled={busy}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => removeWorkshop(w, wOptions.length)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </header>
            )}

            <ul className={styles.items}>
              {wOptions.map((o, oi) =>
                isEditing("option", o.id) ? (
                  <li key={o.id}>
                    <OptionForm
                      initial={{
                        name: o.name,
                        price: String(o.price),
                        note: o.note ?? "",
                        addOn: o.add_on,
                      }}
                      busy={busy}
                      onSave={(v) => saveOption(o.id, w.id, v)}
                      onCancel={() => setEditing(null)}
                    />
                  </li>
                ) : (
                  <li key={o.id} className={styles.item}>
                    <div className={styles.itemMain}>
                      <strong className={styles.itemName}>
                        {o.name}
                        {o.note && <small> ({o.note})</small>}
                      </strong>
                      {o.add_on && <span className={styles.group}>Add-on</span>}
                    </div>
                    <span className={styles.price}>{formatPrice(o.price)}</span>

                    <div className={styles.tools}>
                      <button
                        type="button"
                        aria-label={`Move ${o.name} up`}
                        disabled={busy || oi === 0}
                        onClick={() =>
                          call({
                            action: "move",
                            kind: "option",
                            id: o.id,
                            dir: "up",
                          })
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${o.name} down`}
                        disabled={busy || oi === wOptions.length - 1}
                        onClick={() =>
                          call({
                            action: "move",
                            kind: "option",
                            id: o.id,
                            dir: "down",
                          })
                        }
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            kind: "option",
                            id: o.id,
                            workshopId: w.id,
                          })
                        }
                        disabled={busy}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.danger}
                        aria-label={`Delete ${o.name}`}
                        onClick={() => removeOption(o)}
                        disabled={busy}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ),
              )}
            </ul>

            {editing?.kind === "option" &&
            editing.id === null &&
            editing.workshopId === w.id ? (
              <OptionForm
                busy={busy}
                onSave={(v) => saveOption(null, w.id, v)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <button
                type="button"
                className={styles.addItem}
                onClick={() =>
                  setEditing({ kind: "option", id: null, workshopId: w.id })
                }
                disabled={busy}
              >
                + Add an option (with price) to {w.title}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
