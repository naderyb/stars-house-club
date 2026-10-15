import { formatPrice } from "@/data/menu";
import { getStats } from "@/lib/admin/stats";
import extra from "@/components/admin/AdminExtras.module.css";
import styles from "@/components/admin/MenuManager.module.css";

export default async function AdminStatsPage() {
  const stats = await getStats();
  const maxDay = Math.max(1, ...stats.week.map((d) => d.total));

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <h1 className={styles.title}>Stats</h1>
      </div>

      <section className={`paper ${extra.hero} ${styles.card}`}>
        <span className={extra.statLabel}>Earned today</span>
        <p className={extra.heroValue}>{formatPrice(stats.today.total)}</p>
        <p className={extra.muted}>
          {stats.today.orders} paid order{stats.today.orders === 1 ? "" : "s"}
        </p>
      </section>

      <div className={extra.stats}>
        <div className={`paper ${extra.stat}`}>
          <span className={extra.statLabel}>Average order today</span>
          <span className={extra.statValue}>
            {formatPrice(stats.today.average)}
          </span>
        </div>
        <div className={`paper ${extra.stat}`}>
          <span className={extra.statLabel}>Not paid yet</span>
          <span className={extra.statValue}>
            {formatPrice(stats.open.total)}
          </span>
          <span className={extra.muted}>
            {stats.open.tables} open order{stats.open.tables === 1 ? "" : "s"}
          </span>
        </div>
        <div className={`paper ${extra.stat}`}>
          <span className={extra.statLabel}>This month</span>
          <span className={extra.statValue}>
            {formatPrice(stats.month.total)}
          </span>
          <span className={extra.muted}>
            {stats.month.orders} paid order{stats.month.orders === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <section className={`paper ${styles.card}`} aria-label="Last 7 days">
        <h2 className={styles.catTitle}>Last 7 days</h2>
        <div className={extra.bars}>
          {stats.week.map((d, i) => (
            <div
              key={d.key}
              className={extra.barCol}
              data-today={i === stats.week.length - 1}
            >
              <div className={extra.barTrack}>
                <div
                  className={extra.bar}
                  style={{ height: `${(d.total / maxDay) * 100}%` }}
                  role="img"
                  aria-label={`${d.label}: ${formatPrice(d.total)}`}
                />
              </div>
              <span className={extra.barValue}>{d.total}</span>
              <span className={extra.barLabel}>{d.label}</span>
            </div>
          ))}
        </div>
        <p className={extra.muted}>Amounts in DA.</p>
      </section>

      <section
        className={`paper ${styles.card}`}
        aria-label="Best sellers today"
      >
        <h2 className={styles.catTitle}>Best sellers today</h2>
        {stats.topItems.length === 0 ? (
          <p className={extra.muted}>Nothing paid yet today.</p>
        ) : (
          <ul className={extra.topList}>
            {stats.topItems.map((i) => (
              <li key={i.name}>
                <span>
                  {i.qty} × {i.name}
                </span>
                <span>{formatPrice(i.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
