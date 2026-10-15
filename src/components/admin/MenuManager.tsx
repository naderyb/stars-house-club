"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatPrice } from "@/data/menu";
import type { AdminCategory, AdminMenuItem } from "@/lib/admin/menuTypes";
import {
  CategoryForm,
  ItemForm,
  type CategoryValues,
  type ItemValues,
} from "./MenuForms";
import styles from "./MenuManager.module.css";
import ConfirmModal from "./ConfirmModal";

type Editing =
  | { kind: "category"; id: string | null }
  | { kind: "item"; id: string | null; categoryId: string }
  | null;

interface Props {
  categories: AdminCategory[];
  items: AdminMenuItem[];
}

export default function MenuManager({ categories, items }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Editing>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<{
    title: string;
    message: string;
    action: Record<string, unknown>;
  } | null>(null);

  /** sends one action to the API. Returns true when it worked */
  const call = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Something went wrong.");
        return false;
      }
      startTransition(() => router.refresh()); // reload the list from the server
      return true;
    } catch {
      setError("Network problem. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveCategory = async (id: string | null, v: CategoryValues) => {
    if (await call({ action: "saveCategory", id: id ?? undefined, ...v }))
      setEditing(null);
  };

  const saveItem = async (
    id: string | null,
    categoryId: string,
    v: ItemValues,
  ) => {
    const ok = await call({
      action: "saveItem",
      id: id ?? undefined,
      categoryId,
      name: v.name,
      note: v.note,
      groupLabel: v.groupLabel,
      price: Number(v.price),
      available: v.available,
    });
    if (ok) setEditing(null);
  };

  const removeCategory = (cat: AdminCategory, count: number) => {
    const msg =
      count > 0
        ? `Delete "${cat.title}" and its ${count} item${count > 1 ? "s" : ""}? This can't be undone.`
        : `Delete "${cat.title}"?`;
    setConfirming({
      title: "Delete category?",
      message: msg,
      action: { action: "deleteCategory", id: cat.id },
    });
  };

  const removeItem = (item: AdminMenuItem) => {
    setConfirming({
      title: "Delete menu item?",
      message: `Delete "${item.name}"? This can't be undone.`,
      action: { action: "deleteItem", id: item.id },
    });
  };

  const isEditing = (kind: "category" | "item", id: string | null) =>
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
        <h1 className={styles.title}>Menu</h1>
        <button
          type="button"
          className={styles.add}
          onClick={() => setEditing({ kind: "category", id: null })}
          disabled={busy}
        >
          + Add category
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {isEditing("category", null) && (
        <div className={`paper ${styles.card}`}>
          <h2 className={styles.formTitle}>New category</h2>
          <CategoryForm
            busy={busy}
            onSave={(v) => saveCategory(null, v)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {categories.length === 0 && !isEditing("category", null) && (
        <p className={`paper ${styles.empty}`}>
          No categories yet. Add your first one.
        </p>
      )}

      {categories.map((cat, ci) => {
        const catItems = items.filter((i) => i.category_id === cat.id);
        const groups = Array.from(
          new Set(
            catItems.map((i) => i.group_label).filter((g): g is string => !!g),
          ),
        );

        return (
          <section
            key={cat.id}
            className={`paper ${styles.card}`}
            aria-label={cat.title}
          >
            {/* category header or its edit form */}
            {isEditing("category", cat.id) ? (
              <>
                <h2 className={styles.formTitle}>Edit category</h2>
                <CategoryForm
                  initial={{
                    title: cat.title,
                    badge: cat.badge ?? "",
                    wide: cat.wide,
                  }}
                  busy={busy}
                  onSave={(v) => saveCategory(cat.id, v)}
                  onCancel={() => setEditing(null)}
                />
              </>
            ) : (
              <header className={styles.catHead}>
                <div className={styles.catInfo}>
                  <h2 className={styles.catTitle}>{cat.title}</h2>
                  <div className={styles.tags}>
                    {cat.badge && (
                      <span className={styles.tag}>{cat.badge}</span>
                    )}
                    {cat.wide && <span className={styles.tag}>Full width</span>}
                    <span className={styles.tag}>
                      {catItems.length} item{catItems.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <div className={styles.tools}>
                  <button
                    type="button"
                    aria-label={`Move ${cat.title} up`}
                    disabled={busy || ci === 0}
                    onClick={() =>
                      call({
                        action: "move",
                        kind: "category",
                        id: cat.id,
                        dir: "up",
                      })
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${cat.title} down`}
                    disabled={busy || ci === categories.length - 1}
                    onClick={() =>
                      call({
                        action: "move",
                        kind: "category",
                        id: cat.id,
                        dir: "down",
                      })
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing({ kind: "category", id: cat.id })}
                    disabled={busy}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => removeCategory(cat, catItems.length)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </header>
            )}

            {/* items */}
            <ul className={styles.items}>
              {catItems.map((item, ii) =>
                isEditing("item", item.id) ? (
                  <li key={item.id}>
                    <ItemForm
                      initial={{
                        name: item.name,
                        price: String(item.price),
                        note: item.note ?? "",
                        groupLabel: item.group_label ?? "",
                        available: item.available,
                      }}
                      groups={groups}
                      busy={busy}
                      onSave={(v) => saveItem(item.id, cat.id, v)}
                      onCancel={() => setEditing(null)}
                    />
                  </li>
                ) : (
                  <li
                    key={item.id}
                    className={styles.item}
                    data-off={!item.available}
                  >
                    <div className={styles.itemMain}>
                      <strong className={styles.itemName}>
                        {item.name}
                        {item.note && <small> ({item.note})</small>}
                      </strong>
                      {item.group_label && (
                        <span className={styles.group}>{item.group_label}</span>
                      )}
                    </div>
                    <span className={styles.price}>
                      {formatPrice(item.price)}
                    </span>

                    <div className={styles.tools}>
                      <button
                        type="button"
                        className={styles.toggle}
                        aria-pressed={item.available}
                        onClick={() =>
                          call({
                            action: "setAvailable",
                            id: item.id,
                            available: !item.available,
                          })
                        }
                        disabled={busy}
                      >
                        {item.available ? "Available" : "Hidden"}
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${item.name} up`}
                        disabled={busy || ii === 0}
                        onClick={() =>
                          call({
                            action: "move",
                            kind: "item",
                            id: item.id,
                            dir: "up",
                          })
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${item.name} down`}
                        disabled={busy || ii === catItems.length - 1}
                        onClick={() =>
                          call({
                            action: "move",
                            kind: "item",
                            id: item.id,
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
                            kind: "item",
                            id: item.id,
                            categoryId: cat.id,
                          })
                        }
                        disabled={busy}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.danger}
                        aria-label={`Delete ${item.name}`}
                        onClick={() => removeItem(item)}
                        disabled={busy}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ),
              )}
            </ul>

            {/* add an item */}
            {editing?.kind === "item" &&
            editing.id === null &&
            editing.categoryId === cat.id ? (
              <ItemForm
                groups={groups}
                busy={busy}
                onSave={(v) => saveItem(null, cat.id, v)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <button
                type="button"
                className={styles.addItem}
                onClick={() =>
                  setEditing({ kind: "item", id: null, categoryId: cat.id })
                }
                disabled={busy}
              >
                + Add an item to {cat.title}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
