import AdminNav from "@/components/admin/AdminNav";
import { requireAdminPage } from "@/lib/admin/session";
import styles from "./panel.module.css";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage(); // not signed in -> login, starter login -> change credentials

  return (
    <main className={`container ${styles.page}`}>
      <AdminNav />
      {children}
    </main>
  );
}
