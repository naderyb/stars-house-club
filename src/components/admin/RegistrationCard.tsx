"use client";

import { useState } from "react";
import { instagramLabel, instagramUrl } from "@/lib/instagram";
import type { AdminRegistration, Status } from "@/lib/admin/types";
import ConfirmModal from "./ConfirmModal";
import { BanDialog, BannedAlert, BannedBadge } from "./BanParts";
import IdViewer from "./IdViewer";
import RejectDialog from "./RejectDialog";
import { RoleBadge, StatusBadge } from "./StatusBadge";
import styles from "./RegistrationCard.module.css";

interface ProofFile {
  url: string;
  kind: "image" | "video";
}

interface Props {
  reg: AdminRegistration;
  onReview: (id: string, status: Status, reason?: string) => void;
  canDecide: boolean;
  canViewId: boolean;
  canErase: boolean;
  onErase: (id: string) => void;
  canBan: boolean;
  onBan: (id: string, banned: boolean, reason: string) => void;
}

export default function RegistrationCard({
  reg,
  onReview,
  canDecide,
  canViewId,
  canErase,
  onErase,
  canBan,
  onBan,
}: Props) {
  const [confirmErase, setConfirmErase] = useState(false);
  const [banDialog, setBanDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [proofs, setProofs] = useState<ProofFile[] | null>(null);
  const [proofState, setProofState] = useState<"idle" | "loading" | "error">(
    "idle",
  );

  const loadProofs = async () => {
    setProofState("loading");
    try {
      const res = await fetch(`/api/admin/proofs?id=${reg.id}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      setProofs(data.files);
      setProofState("idle");
    } catch {
      setProofState("error");
    }
  };

  const artType =
    reg.art_type === "Other"
      ? `Other: ${reg.art_type_other ?? ""}`
      : reg.art_type;

  return (
    <article
      id={`registration-${reg.id}`}
      className={`paper ${styles.card}`}
      style={
        reg.banned
          ? { outline: "4px solid var(--red)", outlineOffset: 2 }
          : undefined
      }
    >
      <header className={styles.head}>
        <h3 className={styles.name}>{reg.full_name}</h3>
        <div className={styles.badges}>
          {reg.banned && <BannedBadge />}
          <RoleBadge role={reg.role} />
          <StatusBadge status={reg.status} />
        </div>
      </header>
      {reg.banned && <BannedAlert reason={reg.ban_reason} />}

      <dl className={styles.meta}>
        {reg.stage_name && (
          <>
            <dt>Artist name</dt>
            <dd>{reg.stage_name}</dd>
          </>
        )}
        {artType && (
          <>
            <dt>Art</dt>
            <dd>{artType}</dd>
          </>
        )}
        <dt>WhatsApp</dt>
        <dd>{reg.phone}</dd>
        {reg.email && (
          <>
            <dt>Email</dt>
            <dd>{reg.email}</dd>
          </>
        )}
        {reg.instagram && (
          <>
            <dt>Instagram</dt>
            <dd>
              <a
                href={instagramUrl(reg.instagram)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {instagramLabel(reg.instagram)}
              </a>
            </dd>
          </>
        )}
        {reg.portfolio_url && (
          <>
            <dt>Link</dt>
            <dd>
              <a
                href={reg.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {reg.portfolio_url.replace(/^https?:\/\//, "")}
              </a>
            </dd>
          </>
        )}
        <dt>Sent</dt>
        <dd>
          {new Date(reg.created_at).toLocaleString("en-GB", {
            timeZone: "Africa/Algiers",
          })}
        </dd>
      </dl>

      <blockquote className={styles.why}>{reg.why}</blockquote>

      {canViewId && (
        <div className={styles.proofs}>
          {reg.has_id ? (
            <IdViewer id={reg.id} name={reg.full_name} />
          ) : (
            <p className={styles.err}>No ID on file.</p>
          )}
        </div>
      )}

      {/* proof of art */}
      {reg.role === "artist" && reg.proof_count > 0 && (
        <div className={styles.proofs}>
          {proofs === null ? (
            <button
              type="button"
              className={styles.proofBtn}
              onClick={loadProofs}
              disabled={proofState === "loading"}
            >
              {proofState === "loading"
                ? "Loading..."
                : `View proof (${reg.proof_count})`}
            </button>
          ) : (
            <div className={styles.proofGrid}>
              {proofs.map((p) =>
                p.kind === "video" ? (
                  <video
                    key={p.url}
                    src={p.url}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <a
                    key={p.url}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={`Proof of art by ${reg.full_name}`} />
                  </a>
                ),
              )}
            </div>
          )}
          {proofState === "error" && (
            <p className={styles.err}>Could not load the files. Try again.</p>
          )}
        </div>
      )}

      {/* decisions only update the registration status */}
      {!canDecide ? null : reg.status === "pending" ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.accept}`}
            onClick={() => onReview(reg.id, "accepted")}
          >
            Accept
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.reject}`}
            onClick={() => setRejectDialog(true)}
          >
            Reject
          </button>
        </div>
      ) : (
        <div className={styles.actions}>
          {reg.status === "rejected" && (
            <p className={styles.reason}>
              {reg.reject_reason
                ? `They see: "${reg.reject_reason}"`
                : "No reason given. They only see that it wasn't their time."}
            </p>
          )}
          <button
            type="button"
            className={styles.btn}
            onClick={() => onReview(reg.id, "pending")}
          >
            Undo (back to pending)
          </button>
        </div>
      )}

      {rejectDialog && (
        <RejectDialog
          name={reg.full_name}
          onCancel={() => setRejectDialog(false)}
          onConfirm={(reason) => {
            setRejectDialog(false);
            onReview(reg.id, "rejected", reason);
          }}
        />
      )}

      {canErase && reg.has_id && (
        <>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setConfirmErase(true)}
          >
            Delete this person&apos;s ID
          </button>
          {confirmErase && (
            <ConfirmModal
              title={`Delete ${reg.full_name}'s ID?`}
              message="Only the ID picture is deleted, for good. Their registration stays. This can't be undone."
              confirmLabel="Delete the ID"
              onCancel={() => setConfirmErase(false)}
              onConfirm={() => {
                setConfirmErase(false);
                onErase(reg.id);
              }}
            />
          )}
        </>
      )}

      {canBan && (
        <>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setBanDialog(true)}
          >
            {reg.banned ? "Lift the ban" : "Ban this person"}
          </button>
          {banDialog && (
            <BanDialog
              mode={reg.banned ? "unban" : "ban"}
              name={reg.full_name}
              onCancel={() => setBanDialog(false)}
              onConfirm={(reason) => {
                setBanDialog(false);
                onBan(reg.id, !reg.banned, reason);
              }}
            />
          )}
        </>
      )}
    </article>
  );
}
