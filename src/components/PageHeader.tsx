import StarLogo from "./StarLogo";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  script?: string;
}

export default function PageHeader({ title, script }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.star}>
        <StarLogo size={88} />
      </div>
      <div>
        <h1 className={styles.title}>
          Stars House <span>{title}</span>
        </h1>
        {script && <p className={`script ${styles.script}`}>{script}</p>}
      </div>
    </header>
  );
}
