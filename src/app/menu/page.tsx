import type { Metadata } from "next";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import MenuSection from "@/components/MenuSection";
import { menuNote } from "@/data/menu";
import { getPublicMenu } from "@/lib/menu";
import styles from "./menu.module.css";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Coffee, tea, cold drinks and homemade desserts at friendly prices at Stars House Club, Algiers.",
};

export const revalidate = 60;

export default async  function MenuPage() {
  const menuSections = await getPublicMenu();
  return (
    <main className={`container ${styles.page}`}>
      <div className={styles.sheet}>
        <PageHeader
          title="Club Menu"
          script="for the dreamers, creators and believers"
        />

        <nav aria-label="Menu sections" className={styles.jump}>
          {menuSections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="btn">
              {s.title}
            </a>
          ))}
        </nav>

        <p className={styles.note}>{menuNote}</p>

        <div className={styles.grid}>
          {menuSections.map((section) => (
            <MenuSection key={section.id} section={section} />
          ))}
        </div>

        <div className={styles.end} aria-hidden="true">
          <hr />
          <Image
            src="/images/ppl.webp"
            alt=""
            width={160}
            height={120}
            className={styles.ppl}
          />
          <hr />
        </div>
      </div>
    </main>
  );
}
