import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import JoinHub from "@/components/JoinHub";
import Reveal from "@/components/Reveal";
import styles from "./join.module.css";

export const metadata: Metadata = {
  title: "Join the House",
  description:
    "Register as a visitor or an artist at Stars House Club, or join as a volunteer, workshop host, event organizer, photographer, videographer or collaborator.",
};

const steps = [
  { title: "Register", text: "Pick visitor or artist and tell us about you." },
  {
    title: "We review",
    text: "We check every registration, and every artist's name.",
  },
  {
    title: "Answer on WhatsApp",
    text: "Accepted or not, we message you there.",
  },
];

export default function JoinPage() {
  return (
    <main className={`container ${styles.page}`}>
      <PageHeader
        title="Club Registration"
        script="everyone is welcome, we just like to know who's coming"
      />

      <Reveal>
        <ol className={styles.steps}>
          {steps.map((s, i) => (
            <li key={s.title} className={`paper ${styles.step}`}>
              <span className={styles.num}>{i + 1}</span>
              <div>
                <h2 className={styles.stepTitle}>{s.title}</h2>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>

      <JoinHub />
    </main>
  );
}
