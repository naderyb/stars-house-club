"use client";

import { useEffect, useId, useRef, useState } from "react";
import { compressImage } from "@/lib/join/compressImage";
import { checkIdMeta } from "@/lib/join/schema";
import { buzz } from "@/lib/haptics";
import styles from "./IdUploader.module.css";

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

const RAW_LIMIT = 30 * 1024 * 1024; // before shrinking

function Preview({ file }: { file: File }) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = ref.current;
    if (image) image.src = url;
    return () => {
      if (image) image.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} alt="Your national ID" className={styles.image} />;
}

export default function IdUploader({ file, onChange, error, disabled }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState("");

  const pick = async (
    list: FileList | null,
    input: HTMLInputElement | null,
  ) => {
    const chosen = list?.[0];
    if (input) input.value = ""; // lets you pick the same picture again
    if (!chosen) return;

    setNote("");
    if (!chosen.type.startsWith("image/")) {
      return setNote("Please choose a picture (a photo or a scanned image).");
    }
    if (chosen.size > RAW_LIMIT) {
      return setNote("That picture is too big. Try taking a new photo.");
    }

    setWorking(true);
    const ready = await compressImage(chosen);
    setWorking(false);

    const problem = checkIdMeta(ready);
    if (problem) return setNote(problem);

    buzz();
    onChange(ready);
  };

  const locked = disabled || working;
  const accept = "image/jpeg,image/png,image/webp,image/heic,image/heif";

  return (
    <div className={styles.wrap}>
      {/* opens the phone camera directly */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => pick(e.target.files, cameraRef.current)}
      />
      {/* a picture or a scan from the gallery / computer */}
      <input
        ref={galleryRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => pick(e.target.files, galleryRef.current)}
      />

      {file ? (
        <div className={styles.preview}>
          <Preview file={file} />
          <div className={styles.previewActions}>
            <small>
              {Math.max(1, Math.round(file.size / 1024))} KB, ready to send
            </small>
            <div className={styles.buttons}>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() => cameraRef.current?.click()}
                disabled={locked}
              >
                Retake
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() => onChange(null)}
                disabled={locked}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.buttons}>
          <button
            type="button"
            id="field-idCard"
            className={styles.pick}
            data-invalid={!!error}
            onClick={() => cameraRef.current?.click()}
            disabled={locked}
            aria-describedby={hintId}
          >
            {working ? "Preparing..." : "Scan with camera"}
          </button>
          <button
            type="button"
            className={styles.pick}
            data-invalid={!!error}
            onClick={() => galleryRef.current?.click()}
            disabled={locked}
            aria-describedby={hintId}
          >
            Upload a picture
          </button>
        </div>
      )}

      <p id={hintId} className={styles.hint}>
        The front of your national ID card, flat and readable. Only the people
        who let you in can see it, and you can ask us to delete it at any time.
      </p>
      {note && (
        <p className={styles.note} role="alert">
          {note}
        </p>
      )}
    </div>
  );
}
