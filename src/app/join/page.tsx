import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import JoinHub from "@/components/JoinHub";
import Reveal from "@/components/Reveal";
import { siteConfig } from "@/data/site";
import { PausedBox } from "@/components/JoinPausedNotice";
import JoinGate from "@/components/JoinGate";
import styles from "./join.module.css";

export const metadata: Metadata = {
  title: "Join the House",
  description:
    "Register as a visitor or an artist at Stars House Club, or join as a volunteer, workshop host, event organizer, photographer, videographer or collaborator.",
};

const steps = [
  { title: "Register", text: "Pick visitor or artist and tell us about you." },
  {
    title: "Wait for the story",
    text: "We post a story when decisions are ready.",
  },
  {
    title: "Check your answer",
    text: "See it online anytime. No waiting for a message.",
  },
];

export default function JoinPage() {
  if (siteConfig.joinPaused) {
    return (
      <main className={`container ${styles.page}`}>
        <PageHeader title="Club Registration" script="we'll be right back" />
        <PausedBox />
      </main>
    );
  }
  return (
    <main className={`container ${styles.page}`}>
      <PageHeader
        title="Club Registration"
        script="everyone is welcome, we just like to know who's coming"
      />

      <JoinGate
        register={
          <>
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
          </>
        }
      />
    </main>
  );
}
