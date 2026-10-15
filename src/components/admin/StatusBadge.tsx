import type { Role, Status } from "@/lib/admin/types";
import styles from "./StatusBadge.module.css";

const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={styles.status} data-status={status}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={styles.role} data-role={role}>
      {role === "artist" ? "Artist" : "Visitor"}
    </span>
  );
}
