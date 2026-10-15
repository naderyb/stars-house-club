"use client";

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import formStyles from "@/components/JoinForm.module.css";
import extra from "./AdminExtras.module.css";
import styles from "./MenuManager.module.css";

export interface EventValues {
  title: string;
  category: string;
  start: string; // value of <input type="datetime-local">
  end: string;
  price: string;
  description: string;
  link: string;
  image: string;
  announce: boolean;
}

export const emptyEvent: EventValues = {
  title: "",
  category: "",
  start: "",
  end: "",
  price: "",
  description: "",
  link: "",
  image: "",
  announce: true,
};

interface Props {
  initial?: EventValues;
  /** categories already used, suggested while typing */
  categories: string[];
  busy: boolean;
  onSave: (values: EventValues) => void;
  onCancel: () => void;
}

export default function EventForm({
  initial,
  categories,
  busy,
  onSave,
  onCancel,
}: Props) {
  const listId = useId();
  const [values, setValues] = useState<EventValues>(initial ?? emptyEvent);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const locked = busy || uploading;

  const set = <K extends keyof EventValues>(key: K, value: EventValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again
    if (!file) return;

    setUploading(true);
    setErrors((prev) => ({ ...prev, image: "" }));
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/events/poster", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setErrors((prev) => ({
          ...prev,
          image: data?.message ?? "Could not upload the image.",
        }));
        return;
      }
      set("image", data.url);
    } catch {
      setErrors((prev) => ({
        ...prev,
        image: "Network problem. Please try again.",
      }));
    } finally {
      setUploading(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!values.title.trim()) next.title = "Give the event a title.";
    if (!values.category.trim()) next.category = "Give the event a category.";
    if (!values.start) next.start = "Pick the start date and time.";
    if (values.end && values.start && values.end <= values.start)
      next.end = "The end must be after the start.";
    if (!values.description.trim())
      next.description = "Add a short description.";
    if (values.link.trim() && !/^https?:\/\//i.test(values.link.trim()))
      next.link = "The link must start with https://";
    setErrors(next);
    if (Object.keys(next).length === 0) onSave(values);
  };

  const err = (key: string) =>
    errors[key] ? (
      <p className={formStyles.error} role="alert">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={formStyles.field}>
        <label htmlFor="ev-title" className={formStyles.label}>
          Title
        </label>
        <input
          id="ev-title"
          className={formStyles.input}
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Live Performances Night"
          maxLength={80}
          autoFocus
          aria-invalid={!!errors.title}
          disabled={locked}
        />
        {err("title")}
      </div>

      <div className={extra.twoCols}>
        <div className={formStyles.field}>
          <label htmlFor="ev-category" className={formStyles.label}>
            Category
          </label>
          <input
            id="ev-category"
            className={formStyles.input}
            list={listId}
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Music, Art, Thrift, Workshop..."
            maxLength={30}
            aria-invalid={!!errors.category}
            disabled={locked}
          />
          <datalist id={listId}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {err("category")}
        </div>

        <div className={formStyles.field}>
          <label htmlFor="ev-price" className={formStyles.label}>
            Price <span className={formStyles.optional}>(optional)</span>
          </label>
          <input
            id="ev-price"
            className={formStyles.input}
            value={values.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="Free, 300 DA..."
            maxLength={30}
            disabled={locked}
          />
        </div>
      </div>

      <div className={extra.twoCols}>
        <div className={formStyles.field}>
          <label htmlFor="ev-start" className={formStyles.label}>
            Starts
          </label>
          <input
            id="ev-start"
            type="datetime-local"
            className={formStyles.input}
            value={values.start}
            onChange={(e) => set("start", e.target.value)}
            aria-invalid={!!errors.start}
            disabled={locked}
          />
          {err("start")}
        </div>

        <div className={formStyles.field}>
          <label htmlFor="ev-end" className={formStyles.label}>
            Ends <span className={formStyles.optional}>(optional)</span>
          </label>
          <input
            id="ev-end"
            type="datetime-local"
            className={formStyles.input}
            value={values.end}
            onChange={(e) => set("end", e.target.value)}
            aria-invalid={!!errors.end}
            disabled={locked}
          />
          {err("end")}
        </div>
      </div>

      <div className={formStyles.field}>
        <label htmlFor="ev-description" className={formStyles.label}>
          Description
        </label>
        <textarea
          id="ev-description"
          className={formStyles.input}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          maxLength={600}
          aria-invalid={!!errors.description}
          disabled={locked}
        />
        {err("description")}
      </div>

      <div className={formStyles.field}>
        <label htmlFor="ev-link" className={formStyles.label}>
          More info link{" "}
          <span className={formStyles.optional}>
            (optional, Instagram post, tickets...)
          </span>
        </label>
        <input
          id="ev-link"
          className={formStyles.input}
          value={values.link}
          onChange={(e) => set("link", e.target.value)}
          placeholder="https://"
          inputMode="url"
          maxLength={300}
          aria-invalid={!!errors.link}
          disabled={locked}
        />
        {err("link")}
      </div>

      <div className={formStyles.field}>
        <span className={formStyles.label}>
          Poster <span className={formStyles.optional}>(optional)</span>
        </span>
        <div className={extra.posterRow}>
          {values.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={values.image}
              alt="Poster preview"
              className={extra.poster}
            />
          )}
          <label className={extra.fileBtn} aria-disabled={locked}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={upload}
              disabled={locked}
            />
            {uploading
              ? "Uploading..."
              : values.image
                ? "Change poster"
                : "Upload a poster"}
          </label>
          {values.image && (
            <button
              type="button"
              className={styles.cancel}
              onClick={() => set("image", "")}
              disabled={locked}
            >
              Remove
            </button>
          )}
        </div>
        <p className={formStyles.hint}>JPG, PNG or WebP, up to 4 MB.</p>
        {err("image")}
      </div>

      <label className={formStyles.check}>
        <input
          type="checkbox"
          checked={values.announce}
          onChange={(e) => set("announce", e.target.checked)}
          disabled={locked}
        />
        <span>Show it in the banner on the Home and Menu pages</span>
      </label>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={`btn btn--red ${styles.save}`}
          disabled={locked}
        >
          {busy ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className={styles.cancel}
          onClick={onCancel}
          disabled={locked}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
