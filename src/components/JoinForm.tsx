"use client";

import Link from "next/link";
import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { artTypes, type JoinRole, type RoleId } from "@/data/join";
import {
  countWords,
  fieldErrors,
  joinSchema,
  MAX_WHY_CHARS,
  MIN_WHY_WORDS,
  normalizePhone,
} from "@/lib/join/schema";
import { buzz } from "@/lib/haptics";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import IdUploader from "./IdUploader";
import ProofUploader from "./ProofUploader";
import StarLogo from "./StarLogo";
import styles from "./JoinForm.module.css";

const EMPTY = {
  fullName: "",
  stageName: "",
  phone: "",
  email: "",
  instagram: "",
  why: "",
  artType: "",
  artTypeOther: "",
  portfolioUrl: "",
  detail: "",
  consent: false,
  dataConsent: false,
  website: "", // honeypot
};

type Values = typeof EMPTY;
type Status = "idle" | "uploading" | "sending" | "done";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, hint, optional, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={`field-${id}`} className={styles.label}>
        {label}
        {optional && <span className={styles.optional}> (optional)</span>}
      </label>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
      {error && (
        <p id={`error-${id}`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface JoinFormProps {
  role: JoinRole;
  onSwitch: (id: RoleId) => void;
}

export default function JoinForm({ role, onSwitch }: JoinFormProps) {
  const isArtist = role.id === "artist";

  const [values, setValues] = useState<Values>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"id" | "art">("id");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [serverError, setServerError] = useState("");

  const busy = status === "uploading" || status === "sending";

  const set =
    (key: keyof Values) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    };

  const buildPayload = (proofPaths: string[], idPath: string) => ({
    role: role.id,
    fullName: values.fullName,
    stageName: values.stageName,
    phone: values.phone,
    email: values.email,
    instagram: values.instagram,
    why: values.why,
    artType: values.artType,
    artTypeOther: values.artTypeOther,
    portfolioUrl: values.portfolioUrl,
    detail: values.detail,
    consent: values.consent,
    dataConsent: values.dataConsent,
    idPath,
    proofPaths,
  });

  const uploadProofs = async () => {
    const res = await fetch("/api/join/upload-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      throw new Error(
        data?.message ?? "Could not prepare your upload. Please try again.",
      );
    }

    const supabase = createBrowserSupabase();
    const slots: { path: string; token: string }[] = data.files;

    for (let i = 0; i < slots.length; i++) {
      const { error } = await supabase.storage
        .from("proofs")
        .uploadToSignedUrl(slots[i].path, slots[i].token, files[i], {
          contentType: files[i].type,
        });
      if (error)
        throw new Error("Upload failed. Check your connection and try again.");
      setProgress(i + 1);
    }

    return {
      uploadId: data.uploadId as string,
      proofPaths: slots.map((s) => s.path),
    };
  };

  const uploadIdCard = async () => {
    if (!idFile) throw new Error("Add a picture of your national ID.");

    const res = await fetch("/api/join/id-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: { name: idFile.name, type: idFile.type, size: idFile.size },
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      throw new Error(
        data?.message ?? "Could not prepare your upload. Please try again.",
      );
    }

    const supabase = createBrowserSupabase();
    const { error } = await supabase.storage
      .from("ids")
      .uploadToSignedUrl(data.path, data.token, idFile, {
        contentType: idFile.type,
      });
    if (error)
      throw new Error("Upload failed. Check your connection and try again.");

    return { idUploadId: data.uploadId as string, idPath: data.path as string };
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setServerError("");

    // file names stand in for the real paths, which exist only after the upload
    const check = joinSchema.safeParse(
      buildPayload(files.map((f) => f.name), idFile?.name ?? ""),
    );
    if (!check.success) {
      const found = fieldErrors(check.error);
      setErrors(found);
      buzz(30);
      const first = Object.keys(found)[0];
      const el = document.getElementById(`field-${first}`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
      return;
    }
    setErrors({});

    try {
      let proofPaths: string[] = [];
      let uploadId = "";

      setStatus("uploading");
      setStage("id");
      const idUpload = await uploadIdCard();

      if (isArtist) {
        setStage("art");
        setProgress(0);
        ({ proofPaths, uploadId } = await uploadProofs());
      }

      setStatus("sending");
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildPayload(proofPaths, idUpload.idPath),
          uploadId,
          idUploadId: idUpload.idUploadId,
          website: values.website,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.errors) setErrors(data.errors);
        setServerError(
          data?.message ?? "Something went wrong. Please try again.",
        );
        setStatus("idle");
        return;
      }

      buzz(20);
      setStatus("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Network problem. Please check your connection.",
      );
      setStatus("idle");
    }
  };

  /* ---------- success ---------- */
  if (status === "done") {
    const firstName = values.fullName.trim().split(/\s+/)[0];
    return (
      <div className={`paper ${styles.success}`} role="status">
        <StarLogo size={72} />
        <h3 className={styles.successTitle}>Registration received!</h3>
        <p>
          Thank you {firstName}. We review every registration, and we&apos;ll
          send you our answer on WhatsApp at{" "}
          <strong>{normalizePhone(values.phone)}</strong>.
        </p>
        <p className="script">see you at the house ♥</p>
        <div className={styles.row}>
          <Link href="/" className="btn">
            Back home
          </Link>
          <Link href="/events" className="btn btn--red">
            See events
          </Link>
        </div>
      </div>
    );
  }

  const words = countWords(values.why);
  const wordsPct = Math.min(100, Math.round((words / MIN_WHY_WORDS) * 100));

  const describe = (id: string) => (errors[id] ? `error-${id}` : undefined);

  const submitLabel =
    status === "uploading"
      ? stage === "id"
        ? "Uploading your ID..."
        : `Uploading your art (${progress}/${files.length})...`
      : status === "sending"
        ? "Sending..."
        : "Send my registration";

  return (
    <form className={`paper ${styles.form}`} onSubmit={onSubmit} noValidate>
      <h3 className={styles.title}>
        Join as {role.id === "artist" || role.id === "visitor" ? "a" : ""}{" "}
        {role.label.toLowerCase()}
      </h3>

      {isArtist && (
        <div className={styles.notice}>
          <p className={`script ${styles.noticeText}`}>
            Not an artist? It&apos;s okay, we still see you.
          </p>
          <button
            type="button"
            className={styles.noticeBtn}
            onClick={() => onSwitch("visitor")}
          >
            Register as a visitor
          </button>
        </div>
      )}

      <Field
        id="fullName"
        label="Full name"
        hint={
          isArtist
            ? "Your real first and last name. We verify artists' names before letting them in."
            : "Your real first and last name."
        }
        error={errors.fullName}
      >
        <input
          id="field-fullName"
          className={styles.input}
          value={values.fullName}
          onChange={set("fullName")}
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          aria-describedby={describe("fullName")}
          disabled={busy}
        />
      </Field>

      {isArtist && (
        <Field
          id="stageName"
          label="Artist name"
          optional
          hint="Only if it's different from your real name."
          error={errors.stageName}
        >
          <input
            id="field-stageName"
            className={styles.input}
            value={values.stageName}
            onChange={set("stageName")}
            aria-invalid={!!errors.stageName}
            aria-describedby={describe("stageName")}
            disabled={busy}
          />
        </Field>
      )}

      <Field
        id="phone"
        label="WhatsApp number"
        hint="We'll send you our answer on WhatsApp, so use your WhatsApp number."
        error={errors.phone}
      >
        <input
          id="field-phone"
          className={styles.input}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0555 12 34 56"
          value={values.phone}
          onChange={set("phone")}
          aria-invalid={!!errors.phone}
          aria-describedby={describe("phone")}
          disabled={busy}
        />
      </Field>

      <Field
        id="email"
        label="Email"
        optional
        hint="Helps us find your registration at the door."
        error={errors.email}
      >
        <input
          id="field-email"
          className={styles.input}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          value={values.email}
          onChange={set("email")}
          aria-invalid={!!errors.email}
          aria-describedby={describe("email")}
          disabled={busy}
        />
      </Field>
      
      <Field
        id="instagram"
        label="Instagram"
        optional
        hint={isArtist ? "So the community can find your work." : undefined}
        error={errors.instagram}
      >
        <div className={styles.prefix}>
          <span aria-hidden="true">@</span>
          <input
            id="field-instagram"
            className={styles.input}
            value={values.instagram}
            onChange={set("instagram")}
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="yourhandle"
            aria-invalid={!!errors.instagram}
            aria-describedby={describe("instagram")}
            disabled={busy}
          />
        </div>
      </Field>

      {/* ---------- artist only ---------- */}
      {isArtist && (
        <>
          <Field
            id="artType"
            label="What type of art do you do?"
            error={errors.artType}
          >
            <select
              id="field-artType"
              className={`${styles.input} ${styles.select}`}
              value={values.artType}
              onChange={set("artType")}
              aria-invalid={!!errors.artType}
              aria-describedby={describe("artType")}
              disabled={busy}
            >
              <option value="">Choose one...</option>
              {artTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "Other" ? "Other (not in the list)" : t}
                </option>
              ))}
            </select>
          </Field>

          {values.artType === "Other" && (
            <div className={styles.reveal}>
              <Field
                id="artTypeOther"
                label="Tell us what you do"
                error={errors.artTypeOther}
              >
                <input
                  id="field-artTypeOther"
                  className={styles.input}
                  value={values.artTypeOther}
                  onChange={set("artTypeOther")}
                  placeholder="e.g. calligraphy, woodwork, stand-up..."
                  aria-invalid={!!errors.artTypeOther}
                  aria-describedby={describe("artTypeOther")}
                  disabled={busy}
                />
              </Field>
            </div>
          )}

          <Field
            id="proofs"
            label="Proof of your art"
            hint="Pictures or a video of your work, so we can see it's really yours."
            error={errors.proofs}
          >
            <ProofUploader
              files={files}
              onChange={(next) => {
                setFiles(next);
                if (errors.proofs)
                  setErrors((prev) => ({ ...prev, proofs: "" }));
              }}
              error={errors.proofs}
              disabled={busy}
            />
          </Field>
        </>
      )}

      {/* ---------- role specific ---------- */}
      {role.detailLabel && (
        <Field
          id="detail"
          label={role.detailLabel}
          optional={!role.detailRequired}
          error={errors.detail}
        >
          <textarea
            id="field-detail"
            className={styles.input}
            rows={3}
            value={values.detail}
            onChange={set("detail")}
            aria-invalid={!!errors.detail}
            aria-describedby={describe("detail")}
            disabled={busy}
          />
        </Field>
      )}

      {role.portfolioLabel && (
        <Field
          id="portfolioUrl"
          label={role.portfolioLabel}
          optional={
            !role.portfolioRequired &&
            !role.portfolioLabel.includes("(optional)")
          }
          error={errors.portfolioUrl}
        >
          <input
            id="field-portfolioUrl"
            className={styles.input}
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="instagram.com/..."
            value={values.portfolioUrl}
            onChange={set("portfolioUrl")}
            aria-invalid={!!errors.portfolioUrl}
            aria-describedby={describe("portfolioUrl")}
            disabled={busy}
          />
        </Field>
      )}

      {/* ---------- the why ---------- */}
      <Field
        id="why"
        label={role.whyLabel}
        hint={role.whyHint}
        error={errors.why}
      >
        <textarea
          id="field-why"
          className={styles.input}
          rows={5}
          maxLength={MAX_WHY_CHARS}
          value={values.why}
          onChange={set("why")}
          aria-invalid={!!errors.why}
          aria-describedby={describe("why")}
          disabled={busy}
        />
        <div className={styles.meter} aria-hidden="true">
          <span
            style={{ width: `${wordsPct}%` }}
            data-done={words >= MIN_WHY_WORDS}
          />
        </div>
        <p className={styles.count}>
          {words >= MIN_WHY_WORDS
            ? `${words} words, perfect ★`
            : `${words}/${MIN_WHY_WORDS} words minimum`}
        </p>
      </Field>

      <Field
        id="idCard"
        label="National ID"
        hint="We check it at the door, so everyone who enters has to show one."
        error={errors.idCard}
      >
        <IdUploader
          file={idFile}
          onChange={(next) => {
            setIdFile(next);
            if (errors.idCard) setErrors((prev) => ({ ...prev, idCard: "" }));
          }}
          error={errors.idCard}
          disabled={busy}
        />
      </Field>

      {/* ---------- consent ---------- */}
      <div className={styles.field}>
        <label className={styles.check}>
          <input
            id="field-consent"
            type="checkbox"
            checked={values.consent}
            onChange={(e) => {
              setValues((v) => ({ ...v, consent: e.target.checked }));
              if (errors.consent)
                setErrors((prev) => ({ ...prev, consent: "" }));
            }}
            aria-invalid={!!errors.consent}
            aria-describedby={describe("consent")}
            disabled={busy}
          />
          <span>
            I&apos;ll respect the place, the art and the people around me, and I
            agree that Stars House keeps my details to review my registration.
          </span>
        </label>
        {errors.consent && (
          <p id="error-consent" className={styles.error} role="alert">
            {errors.consent}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.check}>
          <input
            id="field-dataConsent"
            type="checkbox"
            checked={values.dataConsent}
            onChange={(e) => {
              setValues((v) => ({ ...v, dataConsent: e.target.checked }));
              if (errors.dataConsent)
                setErrors((prev) => ({ ...prev, dataConsent: "" }));
            }}
            aria-invalid={!!errors.dataConsent}
            aria-describedby={describe("dataConsent")}
            disabled={busy}
          />
          <span>
            I agree that Stars House Club keeps my personal data private and
            uses it only to welcome me among them.{" "}
            <Link href="/privacy" target="_blank">
              How we protect it
            </Link>
          </span>
        </label>
        {errors.dataConsent && (
          <p id="error-dataConsent" className={styles.error} role="alert">
            {errors.dataConsent}
          </p>
        )}
      </div>

      {/* honeypot: real people never see or fill this */}
      <div className={styles.trap} aria-hidden="true">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={set("website")}
          />
        </label>
      </div>

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
        {submitLabel}
      </button>

      {busy && (
        <p className={`script ${styles.wait}`}>
          keep this page open until it&apos;s done
        </p>
      )}
    </form>
  );
}
