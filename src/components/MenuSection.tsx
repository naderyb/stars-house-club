import { formatPrice, type MenuSection as MenuSectionType } from "@/data/menu";
import styles from "./MenuSection.module.css";

export default function MenuSection({ section }: { section: MenuSectionType }) {
  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-title`}
      className={`${styles.section} ${section.wide ? styles.wide : ""}`}
    >
      <div className={styles.head}>
        <h2 id={`${section.id}-title`} className={styles.title}>
          {section.title}
        </h2>
        {section.badge && <span className={styles.badge}>{section.badge}</span>}
      </div>

      {section.groups.map((group, g) => (
        <div key={g} className={styles.group}>
          {group.title && (
            <h3 className={styles.groupTitle}>
              <span aria-hidden="true">★</span> {group.title}
            </h3>
          )}
          <ul className={styles.list}>
            {group.items.map((item) => (
              <li key={item.name} className={styles.item}>
                <span className={styles.name}>
                  {item.name}
                  {item.note && <small> ({item.note})</small>}
                </span>
                <span className={styles.dots} aria-hidden="true" />
                <span className={styles.price}>{formatPrice(item.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
