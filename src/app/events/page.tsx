import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import EventsBoard from "@/components/EventsBoard";
import { getPublicEvents } from "@/lib/publicEvents";
import styles from "./events.module.css";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming events at Stars House Club in Algiers: artist spotlights, live performances, pop-up thrifting, fashion shows and more.",
};

// Keep public events close to the admin-managed data.
export const revalidate = 60;

const initialNow = Date.now();

export default async function EventsPage() {
  const events = await getPublicEvents();

  return (
    <main className={`container ${styles.page}`}>
      <PageHeader title="Club Events" script="what's happening at the house" />
      <EventsBoard events={events} initialNow={initialNow} />
    </main>
  );
}
