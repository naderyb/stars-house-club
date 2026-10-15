import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import WorkshopBooking from "@/components/WorkshopBooking";
import styles from "./workshops.module.css";

export const metadata: Metadata = {
  title: "Workshops",
  description:
    "Painting, clay and friendship bracelet workshops at Stars House Club, Algiers. Friendly prices, book on WhatsApp.",
};

export default function WorkshopsPage() {
  return (
    <main className={`container ${styles.page}`}>
      <PageHeader
        title="Club Workshops"
        script="come make something with your hands"
      />

      <p className={`paper ${styles.intro}`}>
        Pick what you want to make, tap <strong>Add</strong>, and send your
        booking on WhatsApp. We&apos;ll confirm the day and time with you.
      </p>

      <WorkshopBooking />

      <div className={`paper ${styles.host}`}>
        <div>
          <h2 className={styles.hostTitle}>Got a skill to share?</h2>
          <p className="script">host a workshop at Stars House</p>
        </div>
        <Link href="/join" className="btn btn--red">
          Host a workshop
        </Link>
      </div>
    </main>
  );
}
