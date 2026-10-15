"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

/** Sends one action to an admin API route, then reloads the page data.
 *  Same behaviour as the menu manager, shared by the new admin sections. */
export function useAdminCall(endpoint: string) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /** returns true when it worked */
  const call = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true);
      setError("");
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.message ?? "Something went wrong.");
          return false;
        }
        startTransition(() => router.refresh());
        return true;
      } catch {
        setError("Network problem. Please try again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [endpoint, router],
  );

  return { call, busy, error };
}
