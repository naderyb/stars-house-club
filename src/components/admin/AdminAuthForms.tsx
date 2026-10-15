"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "@/components/JoinForm.module.css";

const post = (url: string, body: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await post("/api/admin/login", { username, password });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Something went wrong.");
        setBusy(false);
        return;
      }
      router.push(data.mustChange ? "/admin/setup" : "/admin");
      router.refresh();
    } catch {
      setError("Network problem. Please try again.");
      setBusy(false);
    }
  };

  return (
    <form className={`paper ${styles.form}`} onSubmit={submit}>
      <h1 className={styles.title}>Admin login</h1>

      <div className={styles.field}>
        <label htmlFor="admin-user" className={styles.label}>
          Username
        </label>
        <input
          id="admin-user"
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          disabled={busy}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="admin-pass" className={styles.label}>
          Password
        </label>
        <input
          id="admin-pass"
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={busy}
        />
      </div>

      {error && (
        <p className={styles.serverError} role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className={`btn btn--red ${styles.submit}`}
        disabled={busy}
      >
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export function CredentialsForm({ mustChange }: { mustChange: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setServerError("");
    try {
      const res = await post("/api/admin/credentials", {
        username,
        password,
        confirm,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.errors) setErrors(data.errors);
        else setServerError(data?.message ?? "Something went wrong.");
        setBusy(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setServerError("Network problem. Please try again.");
      setBusy(false);
    }
  };

  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    type: string,
    autoComplete: string,
  ) => (
    <div className={styles.field}>
      <label htmlFor={`cred-${id}`} className={styles.label}>
        {label}
      </label>
      <input
        id={`cred-${id}`}
        type={type}
        className={styles.input}
        value={value}
        onChange={(e) => set(e.target.value)}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        aria-invalid={!!errors[id]}
        disabled={busy}
      />
      {errors[id] && (
        <p className={styles.error} role="alert">
          {errors[id]}
        </p>
      )}
    </div>
  );

  return (
    <form className={`paper ${styles.form}`} onSubmit={submit}>
      <h1 className={styles.title}>
        {mustChange ? "Set your own login" : "Change my login"}
      </h1>
      <p className={styles.hint}>
        {mustChange
          ? "Welcome! Before anything else, choose your own username and password. The starter login stops working as soon as you save."
          : "Choose a new username and password."}
      </p>

      {field(
        "username",
        "New username",
        username,
        setUsername,
        "text",
        "username",
      )}
      {field(
        "password",
        "New password (10 characters minimum)",
        password,
        setPassword,
        "password",
        "new-password",
      )}
      {field(
        "confirm",
        "Repeat the password",
        confirm,
        setConfirm,
        "password",
        "new-password",
      )}

      {serverError && (
        <p className={styles.serverError} role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        className={`btn btn--red ${styles.submit}`}
        disabled={busy}
      >
        {busy ? "Saving..." : "Save my login"}
      </button>
    </form>
  );
}
