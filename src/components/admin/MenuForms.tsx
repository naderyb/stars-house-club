"use client";

import { useId, useState, type FormEvent } from "react";
import formStyles from "@/components/JoinForm.module.css";
import styles from "./MenuManager.module.css";

/* ---------- category ---------- */
export interface CategoryValues {
  title: string;
  badge: string;
  wide: boolean;
}

interface CategoryFormProps {
  initial?: CategoryValues;
  busy: boolean;
  onSave: (values: CategoryValues) => void;
  onCancel: () => void;
}

export function CategoryForm({
  initial,
  busy,
  onSave,
  onCancel,
}: CategoryFormProps) {
  const [values, setValues] = useState<CategoryValues>(
    initial ?? { title: "", badge: "", wide: false },
  );
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) return setError("Give the category a name.");
    setError("");
    onSave(values);
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={formStyles.field}>
        <label htmlFor="cat-title" className={formStyles.label}>
          Category name
        </label>
        <input
          id="cat-title"
          className={formStyles.input}
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          placeholder="e.g. Hot Drinks"
          maxLength={60}
          autoFocus
          disabled={busy}
        />
        {error && (
          <p className={formStyles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <div className={formStyles.field}>
        <label htmlFor="cat-badge" className={formStyles.label}>
          Sticker <span className={formStyles.optional}>(optional)</span>
        </label>
        <input
          id="cat-badge"
          className={formStyles.input}
          value={values.badge}
          onChange={(e) => setValues({ ...values, badge: e.target.value })}
          placeholder="e.g. Homemade!"
          maxLength={30}
          disabled={busy}
        />
      </div>

      <label className={formStyles.check}>
        <input
          type="checkbox"
          checked={values.wide}
          onChange={(e) => setValues({ ...values, wide: e.target.checked })}
          disabled={busy}
        />
        <span>
          Show this category full width on the menu (good for long lists)
        </span>
      </label>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={`btn btn--red ${styles.save}`}
          disabled={busy}
        >
          {busy ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className={styles.cancel}
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ---------- item ---------- */
export interface ItemValues {
  name: string;
  price: string;
  note: string;
  groupLabel: string;
  available: boolean;
}

interface ItemFormProps {
  initial?: ItemValues;
  /** group names already used in this category, suggested while typing */
  groups: string[];
  busy: boolean;
  onSave: (values: ItemValues) => void;
  onCancel: () => void;
}

export function ItemForm({
  initial,
  groups,
  busy,
  onSave,
  onCancel,
}: ItemFormProps) {
  const listId = useId();
  const [values, setValues] = useState<ItemValues>(
    initial ?? {
      name: "",
      price: "",
      note: "",
      groupLabel: "",
      available: true,
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Give the item a name.";
    if (!/^\d{1,7}$/.test(values.price.trim()))
      next.price = "Enter the price in DA, numbers only.";
    setErrors(next);
    if (Object.keys(next).length === 0) onSave(values);
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={formStyles.field}>
        <label htmlFor="item-name" className={formStyles.label}>
          Name
        </label>
        <input
          id="item-name"
          className={formStyles.input}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          placeholder="e.g. Tiramisu"
          maxLength={80}
          autoFocus
          aria-invalid={!!errors.name}
          disabled={busy}
        />
        {errors.name && (
          <p className={formStyles.error} role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div className={formStyles.field}>
        <label htmlFor="item-price" className={formStyles.label}>
          Price (DA)
        </label>
        <input
          id="item-price"
          className={formStyles.input}
          value={values.price}
          onChange={(e) => setValues({ ...values, price: e.target.value })}
          inputMode="numeric"
          placeholder="300"
          aria-invalid={!!errors.price}
          disabled={busy}
        />
        {errors.price && (
          <p className={formStyles.error} role="alert">
            {errors.price}
          </p>
        )}
      </div>

      <div className={formStyles.field}>
        <label htmlFor="item-note" className={formStyles.label}>
          Small note <span className={formStyles.optional}>(optional)</span>
        </label>
        <input
          id="item-note"
          className={formStyles.input}
          value={values.note}
          onChange={(e) => setValues({ ...values, note: e.target.value })}
          placeholder="e.g. x4, 250g"
          maxLength={60}
          disabled={busy}
        />
      </div>

      <div className={formStyles.field}>
        <label htmlFor="item-group" className={formStyles.label}>
          Sub-title inside the category{" "}
          <span className={formStyles.optional}>(optional)</span>
        </label>
        <input
          id="item-group"
          className={formStyles.input}
          list={listId}
          value={values.groupLabel}
          onChange={(e) => setValues({ ...values, groupLabel: e.target.value })}
          placeholder="e.g. Coffee, Tea, Soda"
          maxLength={40}
          disabled={busy}
        />
        <datalist id={listId}>
          {groups.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </div>

      <label className={formStyles.check}>
        <input
          type="checkbox"
          checked={values.available}
          onChange={(e) =>
            setValues({ ...values, available: e.target.checked })
          }
          disabled={busy}
        />
        <span>
          Available (untick it to hide it from the menu, like when it&apos;s sold out)
        </span>
      </label>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={`btn btn--red ${styles.save}`}
          disabled={busy}
        >
          {busy ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className={styles.cancel}
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
