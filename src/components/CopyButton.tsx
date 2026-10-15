"use client";

import { useState } from "react";
import { buzz } from "@/lib/haptics";

export default function CopyButton({
  text,
  label = "Copy address",
  className = "btn",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      buzz();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked: do nothing, the address is visible anyway
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={copy}
      aria-live="polite"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
