import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { siteConfig } from "@/data/site";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Stars House Club protects the personal data you share when you register.",
};

const sections = [
  {
    title: "What we ask for",
    text: "Your name, WhatsApp number, optionally your email and Instagram, why you want to come, a picture of your national ID, and for artists a few pictures or a video of their work.",
  },
  {
    title: "Why",
    text: "To review your registration and check at the door that the people coming in are the people we accepted. We use it for nothing else, and we never sell or share it.",
  },
  {
    title: "Who can see it",
    text: "Only the people of the house who need it: the admins, the managers and the security at the door. Your ID is kept in private storage that has no public link.",
  },
  {
    title: "How long we keep it",
    text: "We keep your details and your ID while you are part of the house. You can ask us to delete your ID, or all your data, at any time and we will do it.",
  },
  {
    title: "Your rights",
    text: "You can ask to see, correct or delete your data at any time, and we will do it. Just message us.",
  },
];

export default function PrivacyPage() {
  return (
    <main className={`container ${styles.page}`}>
      <PageHeader title="Privacy" script="your details stay between us" />

      <div className={styles.list}>
        {sections.map((s) => (
          <section key={s.title} className={`paper ${styles.card}`}>
            <h2 className={styles.title}>{s.title}</h2>
            <p>{s.text}</p>
          </section>
        ))}

        <section className={`paper ${styles.card}`}>
          <h2 className={styles.title}>Ask us anything</h2>
          <p>
            We handle your data in line with the Algerian law on the protection
            of personal data. To access or delete yours, message us on{" "}
            <a
              href={siteConfig.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
