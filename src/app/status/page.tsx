import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import StatusChecker from "@/components/StatusChecker";
import styles from "./status.module.css";

export const metadata: Metadata = {
  title: "Check my status",
  description: "See if your Stars House Club registration was accepted.",
};

export default function StatusPage() {
  return (
    <main className="container">
      <PageHeader title="Did I get in?" script="use your registration details" />
      <div className={styles.narrow}>
        <StatusChecker />
      </div>
    </main>
  );
}
