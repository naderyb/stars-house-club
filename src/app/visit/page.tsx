import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import HoursCard from "@/components/HoursCard";
import MapEmbed from "@/components/MapEmbed";
import CopyButton from "@/components/CopyButton";
import Reveal from "@/components/Reveal";
import { siteConfig } from "@/data/site";
import {
  address,
  directionsUrl,
  mapEmbedSrc,
  rules,
} from "@/data/visit";
import styles from "./visit.module.css";

export const metadata: Metadata = {
  title: "Visit Us",
  description:
    "How to find Stars House Club in Algiers: address, map, opening hours, step-by-step directions and house rules.",
};

export default function VisitPage() {
  const fullAddress = address.lines.join(", ");

  return (
    <main className={`container ${styles.page}`}>
      <PageHeader
        title="Club Is Hiding"
        script="hard to find? we'll walk you there."
      />

      {/* ---------- quick actions ---------- */}
      <div className={styles.actions}>
        <a
          href={directionsUrl}
          className="btn btn--red"
          target="_blank"
          rel="noopener noreferrer"
        >
          Get directions
        </a>
        <a
          href={siteConfig.whatsapp}
          className="btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp us
        </a>
      </div>

      {/* ---------- address + hours ---------- */}
      <div className={styles.info}>
        <section
          className={`paper ${styles.address}`}
          aria-labelledby="address-title"
        >
          <h2 id="address-title" className={styles.title}>
            The address
          </h2>
          <address className={styles.lines}>
            {address.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
          <p className={`script ${styles.landmark}`}>{address.landmark}</p>
          <div className={styles.row}>
            <CopyButton text={fullAddress} />
            <a
              href={directionsUrl}
              className="btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Maps
            </a>
          </div>
        </section>

        <HoursCard />
      </div>

      {/* ---------- map ---------- */}
      <section aria-labelledby="map-title" className={styles.section}>
        <h2 id="map-title" className={styles.sectionTitle}>
          On the map
        </h2>
        <MapEmbed src={mapEmbedSrc} href={directionsUrl} />
      </section>

      {/* ---------- house rules ---------- */}
      <section aria-labelledby="rules-title" className={styles.section}>
        <h2 id="rules-title" className={styles.sectionTitle}>
          House rules
        </h2>
        <div className={styles.rules}>
          {rules.map((rule, i) => (
            <Reveal
              key={rule.title}
              className={i % 2 === 0 ? styles.left : styles.right}
            >
              <div className={`paper ${styles.rule}`}>
                <span className={styles.star} aria-hidden="true">
                  ★
                </span>
                <div>
                  <h3 className={styles.ruleTitle}>{rule.title}</h3>
                  <p>{rule.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- socials ---------- */}
      <section
        className={`paper ${styles.social}`}
        aria-labelledby="social-title"
      >
        <div>
          <h2 id="social-title" className={styles.title}>
            Follow the house
          </h2>
          <p className="script">events, artists and a peek inside</p>
        </div>
        <div className={styles.row}>
          <a
            href={siteConfig.instagram}
            className="btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          {/* <a
            href={siteConfig.tiktok}
            className="btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            TikTok
          </a> */}
        </div>
      </section>
    </main>
  );
}
