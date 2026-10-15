"use client";

import { useEffect, useRef, useState } from "react";
import { getRole, isRoleId, roles, type RoleId } from "@/data/join";
import { buzz } from "@/lib/haptics";
import JoinForm from "./JoinForm";
import styles from "./JoinHub.module.css";

const mainRoles = roles.filter((r) => r.main);
const otherRoles = roles.filter((r) => !r.main);

export default function JoinHub() {
  const [roleId, setRoleId] = useState<RoleId | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    formRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  };

  // arriving from /join#artist (or any role id) opens that form directly
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (isRoleId(hash)) {
      setTimeout(() => setRoleId(hash), 0);
      setTimeout(scrollToForm, 150);
    }
  }, []);

  const choose = (id: RoleId) => {
    buzz();
    setRoleId(id);
    window.history.replaceState(null, "", `#${id}`);
    requestAnimationFrame(scrollToForm);
  };

  const role = roleId ? getRole(roleId) : null;

  return (
    <div className={styles.hub}>
      <section aria-labelledby="who-title">
        <h2 id="who-title" className={styles.heading}>
          I&apos;m joining as...
        </h2>

        <div className={styles.main}>
          {mainRoles.map((r) => (
            <button
              key={r.id}
              type="button"
              className={styles.tile}
              aria-pressed={r.id === roleId}
              onClick={() => choose(r.id)}
            >
              <span className={styles.tileTitle}>{r.label}</span>
              <span className={styles.tileText}>{r.tagline}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="more-title">
        <h2 id="more-title" className={styles.subheading}>
          Want to do more than visit?
        </h2>
        <p className={`script ${styles.sub}`}>
          there&apos;s a place for you in the house
        </p>

        <ul className={styles.others}>
          {otherRoles.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={styles.chip}
                aria-pressed={r.id === roleId}
                onClick={() => choose(r.id)}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div ref={formRef} className={styles.formWrap}>
        {role ? (
          <JoinForm key={role.id} role={role} onSwitch={choose} />
        ) : (
          <p className={`paper ${styles.prompt}`}>
            <span className="script">pick a door above to start ↑</span>
          </p>
        )}
      </div>
    </div>
  );
}
