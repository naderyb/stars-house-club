"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  checkProofMeta,
  MAX_IMAGE_MB,
  MAX_PROOFS,
  MAX_VIDEO_MB,
} from "@/lib/join/schema";
import { buzz } from "@/lib/haptics";
import styles from "./ProofUploader.module.css";

interface ProofUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
  disabled?: boolean;
}

function Thumb({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const objectUrl = URL.createObjectURL(file);
    const image = imageRef.current;
    if (image) image.src = objectUrl;
    return () => {
      if (image) image.removeAttribute("src");
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (file.type.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img ref={imageRef} alt="" className={styles.thumb} />;
  }
  return (
    <span className={styles.thumb} aria-hidden="true">
      ▶
    </span>
  );
}

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function ProofUploader({
  files,
  onChange,
  error,
  disabled,
}: ProofUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const hintId = useId();

  const pick = (list: FileList | null) => {
    const incoming = Array.from(list ?? []);
    const problems: string[] = [];
    const accepted: File[] = [];

    for (const file of incoming) {
      if (files.length + accepted.length >= MAX_PROOFS) {
        problems.push(`You can add up to ${MAX_PROOFS} files.`);
        break;
      }
      const problem = checkProofMeta(file);
      if (problem) problems.push(problem);
      else accepted.push(file);
    }

    setNotes(problems);
    if (accepted.length) {
      buzz();
      onChange([...files, ...accepted]);
    }
    if (inputRef.current) inputRef.current.value = ""; // lets you pick the same file again
  };

  const remove = (index: number) => {
    buzz();
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.wrap}>
      <input
        ref={inputRef}
        id="field-proofs"
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        multiple
        hidden
        disabled={disabled}
        onChange={(e) => pick(e.target.files)}
      />

      <button
        type="button"
        className={styles.drop}
        disabled={disabled || files.length >= MAX_PROOFS}
        onClick={() => inputRef.current?.click()}
        aria-describedby={hintId}
        data-invalid={!!error}
      >
        <span className={styles.plus} aria-hidden="true">
          +
        </span>
        <span>
          {files.length === 0
            ? "Add pictures or a video of your art"
            : "Add another file"}
        </span>
      </button>

      <p id={hintId} className={styles.hint}>
        Up to {MAX_PROOFS} files. Pictures up to {MAX_IMAGE_MB} MB, videos up to{" "}
        {MAX_VIDEO_MB} MB.
      </p>

      {files.length > 0 && (
        <ul className={styles.list}>
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className={styles.item}>
              <Thumb file={file} />
              <span className={styles.info}>
                <strong>{file.name}</strong>
                <small>{formatSize(file.size)}</small>
              </span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove(i)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {notes.length > 0 && (
        <ul className={styles.notes} role="alert">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
