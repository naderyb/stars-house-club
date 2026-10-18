"use client";

import { useState, type FormEvent } from "react";
import formStyles from "@/components/JoinForm.module.css";
import ConfirmModal from "./ConfirmModal";
import { useAdminCall } from "./useAdminCall";
import styles from "./TeamManager.module.css";
import { ROLES, roleHints, roleLabels, type Role } from "@/lib/admin/roles";

export interface TeamAdmin {
  id: string;
  username: string;
  role: Role;
  must_change: boolean;
  created_at: string;
}
interface Props {
  admins: TeamAdmin[];
  /** id of the admin who is looking at this page */
  meId: string;
}

interface Handoff {
  username: string;
  password: string;
  role: Role;
  kind: "new" | "reset";
}

/** no look-alike characters (0/O, 1/l/I), so it's easy to read out or type */
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generatePassword(length = 12) {
  const limit = 256 - (256 % ALPHABET.length); // avoids a biased pick
  let out = "";
  while (out.length < length) {
    const bytes = new Uint8Array(length * 2);
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b < limit && out.length < length)
        out += ALPHABET[b % ALPHABET.length];
    }
  }
  return out;
}

interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

function PasswordField({ id, value, onChange, disabled }: PasswordFieldProps) {
  return (
    <div className={formStyles.field}>
      <label htmlFor={id} className={formStyles.label}>
        Temporary password
      </label>
      <p className={formStyles.hint}>
        They will be asked to choose their own the first time they sign in.
      </p>
      <div className={styles.passRow}>
        <input
          id={id}
          className={`${formStyles.input} ${styles.mono}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
        />
        <button
          type="button"
          className={styles.small}
          onClick={() => onChange(generatePassword())}
          disabled={disabled}
        >
          New one
        </button>
      </div>
    </div>
  );
}

export default function TeamManager({ admins, meId }: Props) {
  const { call, busy, error } = useAdminCall("/api/admin/team");

  const [adding, setAdding] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("waiter");

  const [resetFor, setResetFor] = useState<TeamAdmin | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const [removeFor, setRemoveFor] = useState<TeamAdmin | null>(null);

  const [localError, setLocalError] = useState("");
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [copied, setCopied] = useState(false);

  const openAdd = () => {
    setHandoff(null);
    setResetFor(null);
    setLocalError("");
    setUsername("");
    setPassword(generatePassword());
    setRole("waiter");
    setAdding(true);
  };

  const openReset = (admin: TeamAdmin) => {
    setHandoff(null);
    setAdding(false);
    setLocalError("");
    setResetPassword(generatePassword());
    setResetFor(admin);
  };

  const submitAdd = async (e: FormEvent) => {
    e.preventDefault();
    const name = username.trim().toLowerCase();
    if (name.length < 3)
      return setLocalError("Username: 3 characters minimum.");
    if (password.length < 8) {
      return setLocalError(
        "The temporary password needs 8 characters minimum.",
      );
    }
    setLocalError("");

    if (await call({ action: "add", username: name, password, role })) {
      setHandoff({ username: name, password, role, kind: "new" });
      setAdding(false);
    }
  };

  const submitReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetFor) return;
    if (resetPassword.length < 8) {
      return setLocalError(
        "The temporary password needs 8 characters minimum.",
      );
    }
    setLocalError("");

    if (
      await call({ action: "reset", id: resetFor.id, password: resetPassword })
    ) {
      setHandoff({
        username: resetFor.username,
        password: resetPassword,
        role: resetFor.role,
        kind: "reset",
      });
      setResetFor(null);
    }
  };

  const confirmRemove = async () => {
    if (!removeFor) return;
    await call({ action: "remove", id: removeFor.id });
    setRemoveFor(null); // on failure the message shows at the top of the page
  };

  const copyHandoff = async () => {
    if (!handoff) return;
    const text = [
      "Stars House Club admin",
      `Role: ${roleLabels[handoff.role]}`,
      `Login: ${window.location.origin}/admin/login`,
      `Username: ${handoff.username}`,
      `Temporary password: ${handoff.password}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the details are on screen anyway */
    }
  };

  const shownError = localError || error;

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <h1 className={styles.title}>Team</h1>
        <button
          type="button"
          className={styles.add}
          onClick={openAdd}
          disabled={busy}
        >
          + Add an admin
        </button>
      </div>

      <p className={styles.note}>
        Give each person their own login, with the role that fits what they do.
        Admins see everything; waiters, cashiers and guards only see their own
        screen.
      </p>

      {shownError && (
        <p className={styles.error} role="alert">
          {shownError}
        </p>
      )}

      {/* shown once, right after creating or resetting */}
      {handoff && (
        <section className={`paper ${styles.handoff}`} role="status">
          <h2 className={styles.formTitle}>
            {handoff.kind === "new" ? "Admin added" : "Password reset"}
          </h2>
          <p>
            Give these to <strong>{handoff.username}</strong>. The password is
            shown only now, and they will choose their own at first sign-in.
          </p>
          <dl className={styles.creds}>
            <dt>Username</dt>
            <dd>{handoff.username}</dd>
            <dt>Temporary password</dt>
            <dd>{handoff.password}</dd>
          </dl>
          <div className={styles.formActions}>
            <button
              type="button"
              className={`btn btn--red ${styles.save}`}
              onClick={copyHandoff}
            >
              {copied ? "Copied ✓" : "Copy details"}
            </button>
            <button
              type="button"
              className={styles.cancel}
              onClick={() => setHandoff(null)}
            >
              Done
            </button>
          </div>
        </section>
      )}

      {adding && (
        <form
          className={`paper ${styles.form}`}
          onSubmit={submitAdd}
          noValidate
        >
          <h2 className={styles.formTitle}>New team member</h2>

          <div className={formStyles.field}>
            <label htmlFor="team-username" className={formStyles.label}>
              Username
            </label>
            <input
              id="team-username"
              className={formStyles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              maxLength={40}
              autoFocus
              disabled={busy}
            />
          </div>

          <div className={formStyles.field}>
            <label htmlFor="team-role" className={formStyles.label}>
              Role
            </label>
            <select
              id="team-role"
              className={formStyles.input}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={busy}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
            <p className={formStyles.hint}>{roleHints[role]}</p>
          </div>

          <PasswordField
            id="team-password"
            value={password}
            onChange={setPassword}
            disabled={busy}
          />

          <div className={styles.formActions}>
            <button
              type="submit"
              className={`btn btn--red ${styles.save}`}
              disabled={busy}
            >
              {busy ? "Saving..." : "Create account"}
            </button>
            <button
              type="button"
              className={styles.cancel}
              onClick={() => setAdding(false)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {resetFor && (
        <form
          className={`paper ${styles.form}`}
          onSubmit={submitReset}
          noValidate
        >
          <h2 className={styles.formTitle}>
            Reset password for {resetFor.username}
          </h2>
          <p className={styles.muted}>
            They will be signed out everywhere and asked to choose a new
            password.
          </p>

          <PasswordField
            id="team-reset-password"
            value={resetPassword}
            onChange={setResetPassword}
            disabled={busy}
          />

          <div className={styles.formActions}>
            <button
              type="submit"
              className={`btn btn--red ${styles.save}`}
              disabled={busy}
            >
              {busy ? "Saving..." : "Reset password"}
            </button>
            <button
              type="button"
              className={styles.cancel}
              onClick={() => setResetFor(null)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <ul className={styles.list}>
        {admins.map((a) => (
          <li key={a.id} className={`paper ${styles.row}`}>
            <div className={styles.who}>
              <strong className={styles.name}>{a.username}</strong>
              <div className={styles.badges}>
                <span className={styles.badge}>{roleLabels[a.role]}</span>
                {a.id === meId && <span className={styles.badge}>You</span>}
                <span
                  className={styles.badge}
                  data-tone={a.must_change ? "wait" : "ok"}
                >
                  {a.must_change ? "Hasn't set their own login yet" : "Active"}
                </span>
              </div>
            </div>

            {a.id !== meId && (
              <div className={styles.tools}>
                <button
                  type="button"
                  onClick={() => openReset(a)}
                  disabled={busy}
                >
                  Reset password
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => setRemoveFor(a)}
                  disabled={busy}
                >
                  Remove
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {removeFor && (
        <ConfirmModal
          title={`Remove ${removeFor.username}?`}
          message="They will be signed out right away and can no longer open the admin panel. This can't be undone."
          confirmLabel="Remove"
          busy={busy}
          onConfirm={confirmRemove}
          onCancel={() => setRemoveFor(null)}
        />
      )}
    </div>
  );
}
