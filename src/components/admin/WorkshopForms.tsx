"use client";

import { useState, type FormEvent } from "react";
import formStyles from "@/components/JoinForm.module.css";
import styles from "./MenuManager.module.css";

/* ---------- workshop ---------- */
export interface WorkshopValues {
  title: string;
  ar: string;
  blurb: string;
  materials: string;
  visible: boolean;
}

interface WorkshopFormProps {
  initial?: WorkshopValues;
  busy: boolean;
  onSave: (values: WorkshopValues) => void;
  onCancel: () => void;
}

export function WorkshopForm({
  initial,
  busy,
  onSave,
  onCancel,
}: WorkshopFormProps) {
  const [values, setValues] = useState<WorkshopValues>(
    initial ?? { title: "", ar: "", blurb: "", materials: "", visible: true },
  );
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) return setError("Give the workshop a name.");
    setError("");
    onSave(values);
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={formStyles.field}>
        <label htmlFor="ws-title" className={formStyles.label}>
          Workshop name
        </label>
        <input
          id="ws-title"
          className={formStyles.input}
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          placeholder="e.g. Painting"
          maxLength={60}
          autoFocus
          aria-invalid={!!error}
          disabled={busy}
        />
        {error && (
          <p className={formStyles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <div className={formStyles.field}>
        <label htmlFor="ws-ar" className={formStyles.label}>
          Arabic name <span className={formStyles.optional}>(optional)</span>
        </label>
        <input
          id="ws-ar"
          className={formStyles.input}
          value={values.ar}
          onChange={(e) => setValues({ ...values, ar: e.target.value })}
          placeholder="e.g. الرسم"
          maxLength={40}
          dir="rtl"
          lang="ar"
          disabled={busy}
        />
      </div>

      <div className={formStyles.field}>
        <label htmlFor="ws-blurb" className={formStyles.label}>
          Short description
        </label>
        <textarea
          id="ws-blurb"
          className={formStyles.input}
          value={values.blurb}
          onChange={(e) => setValues({ ...values, blurb: e.target.value })}
          rows={3}
          maxLength={300}
          disabled={busy}
        />
      </div>

      <div className={formStyles.field}>
        <label htmlFor="ws-materials" className={formStyles.label}>
          Materials sticker{" "}
          <span className={formStyles.optional}>(optional)</span>
        </label>
        <input
          id="ws-materials"
          className={formStyles.input}
          value={values.materials}
          onChange={(e) => setValues({ ...values, materials: e.target.value })}
          placeholder="e.g. Materials included"
          maxLength={80}
          disabled={busy}
        />
      </div>

      <label className={formStyles.check}>
        <input
          type="checkbox"
          checked={values.visible}
          onChange={(e) => setValues({ ...values, visible: e.target.checked })}
          disabled={busy}
        />
        <span>Show this workshop on the website</span>
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

/* ---------- option (a priced choice inside a workshop) ---------- */
export interface OptionValues {
  name: string;
  price: string;
  note: string;
  addOn: boolean;
}

interface OptionFormProps {
  initial?: OptionValues;
  busy: boolean;
  onSave: (values: OptionValues) => void;
  onCancel: () => void;
}

export function OptionForm({
  initial,
  busy,
  onSave,
  onCancel,
}: OptionFormProps) {
  const [values, setValues] = useState<OptionValues>(
    initial ?? { name: "", price: "", note: "", addOn: false },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Give the option a name.";
    if (!/^\d{1,7}$/.test(values.price.trim()))
      next.price = "Enter the price in DA, numbers only.";
    setErrors(next);
    if (Object.keys(next).length === 0) onSave(values);
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={formStyles.field}>
        <label htmlFor="opt-name" className={formStyles.label}>
          Name
        </label>
        <input
          id="opt-name"
          className={formStyles.input}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          placeholder="e.g. Canvas"
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
        <label htmlFor="opt-price" className={formStyles.label}>
          Price (DA)
        </label>
        <input
          id="opt-price"
          className={formStyles.input}
          value={values.price}
          onChange={(e) => setValues({ ...values, price: e.target.value })}
          inputMode="numeric"
          placeholder="1500"
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
        <label htmlFor="opt-note" className={formStyles.label}>
          Small note <span className={formStyles.optional}>(optional)</span>
        </label>
        <input
          id="opt-note"
          className={formStyles.input}
          value={values.note}
          onChange={(e) => setValues({ ...values, note: e.target.value })}
          placeholder="e.g. 250g"
          maxLength={40}
          disabled={busy}
        />
      </div>

      <label className={formStyles.check}>
        <input
          type="checkbox"
          checked={values.addOn}
          onChange={(e) => setValues({ ...values, addOn: e.target.checked })}
          disabled={busy}
        />
        <span>
          This is an add-on (customers can only pick it after choosing another
          option of this workshop, like &quot;Add painting&quot;)
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
