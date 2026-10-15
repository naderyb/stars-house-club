"use client";

import { useState } from "react";
import { formatPrice } from "@/data/menu";
import type {
  AdminWorkshop,
  AdminWorkshopOption,
} from "@/lib/admin/workshopTypes";
import { useAdminCall } from "./admin/useAdminCall";
import ConfirmModal from "./admin/ConfirmModal";
import styles from "./MenuManager.module.css";

export type WorkshopValues = {
  title: string;
  ar: string;
  blurb: string;
  materials: string;
  visible: boolean;
};

export type OptionValues = {
  name: string;
  price: string;
  note: string;
  addOn: boolean;
};

function WorkshopForm({
  initial = {
    title: "",
    ar: "",
    blurb: "",
    materials: "",
    visible: true,
  },
  busy,
  onSave,
  onCancel,
}: {
  initial?: WorkshopValues;
  busy: boolean;
  onSave: (values: WorkshopValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const update = (key: keyof WorkshopValues, value: string | boolean) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave(values);
      }}
    >
      <label>
        Title
        <input required value={values.title} onChange={(e) => update("title", e.target.value)} />
      </label>
      <label>
        Arabic title
        <input value={values.ar} onChange={(e) => update("ar", e.target.value)} dir="rtl" />
      </label>
      <label>
        Description
        <textarea value={values.blurb} onChange={(e) => update("blurb", e.target.value)} />
      </label>
      <label>
        Materials
        <input value={values.materials} onChange={(e) => update("materials", e.target.value)} />
      </label>
      <label>
        <input type="checkbox" checked={values.visible} onChange={(e) => update("visible", e.target.checked)} />
        Visible
      </label>
      <div className={styles.tools}>
        <button type="submit" disabled={busy}>Save</button>
        <button type="button" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
}

function OptionForm({
  initial = { name: "", price: "", note: "", addOn: false },
  busy,
  onSave,
  onCancel,
}: {
  initial?: OptionValues;
  busy: boolean;
  onSave: (values: OptionValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const update = (key: keyof OptionValues, value: string | boolean) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave(values);
      }}
    >
      <label>
        Name
        <input required value={values.name} onChange={(e) => update("name", e.target.value)} />
      </label>
      <label>
        Price
        <input required type="number" min="0" step="0.01" value={values.price} onChange={(e) => update("price", e.target.value)} />
      </label>
      <label>
        Note
        <input value={values.note} onChange={(e) => update("note", e.target.value)} />
      </label>
      <label>
        <input type="checkbox" checked={values.addOn} onChange={(e) => update("addOn", e.target.checked)} />
        Add-on
      </label>
      <div className={styles.tools}>
        <button type="submit" disabled={busy}>Save</button>
        <button type="button" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
}

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
            onSave={(v: WorkshopValues) => saveWorkshop(null, v)}
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
                    ar: w.title_ar ?? "",
                    blurb: w.blurb,
                    materials: w.materials ?? "",
                    visible: w.active,
                  }}
                  busy={busy}
                  onSave={(v: WorkshopValues) => saveWorkshop(w.id, v)}
                  onCancel={() => setEditing(null)}
                />
              </>
            ) : (
              <header className={styles.catHead}>
                <div className={styles.catInfo}>
                  <h2 className={styles.catTitle}>
                    {w.title}
                    {w.title_ar && (
                      <small lang="ar" dir="rtl">
                        {" "}
                        {w.title_ar}
                      </small>
                    )}
                  </h2>
                  <div className={styles.tags}>
                    {!w.active && <span className={styles.tag}>Hidden</span>}
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
                    aria-pressed={w.active}
                    onClick={() =>
                      call({
                        action: "setVisible",
                        id: w.id,
                        visible: !w.active,
                      })
                    }
                    disabled={busy}
                  >
                    {w.active ? "Visible" : "Hidden"}
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
                      onSave={(v: OptionValues) => saveOption(o.id, w.id, v)}
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
                onSave={(v: OptionValues) => saveOption(null, w.id, v)}
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
