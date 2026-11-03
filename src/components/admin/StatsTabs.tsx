"use client";

import { useState, type ReactNode } from "react";
import { formatPrice } from "@/data/menu";
import type { TodaySale } from "@/lib/admin/stats";
import extra from "./AdminExtras.module.css";
import styles from "./MenuManager.module.css";

interface Props {
  overview: ReactNode;
  sales: TodaySale[];
}

export default function StatsTabs({ overview, sales }: Props) {
  const [active, setActive] = useState<"overview" | "sales">("overview");

  return (
    <>
      <div className={extra.statTabs} role="tablist" aria-label="Stats views">
        <button
          type="button"
          role="tab"
          aria-selected={active === "overview"}
          className={extra.statTab}
          onClick={() => setActive("overview")}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={active === "sales"}
          className={extra.statTab}
          onClick={() => setActive("sales")}
        >
          Sales today <span>{sales.length}</span>
        </button>
      </div>

      {active === "overview" ? (
        overview
      ) : (
        <section
          className={`paper ${styles.card}`}
          role="tabpanel"
          aria-label="Sales today"
        >
          <div className={extra.panelHead}>
            <h2 className={styles.catTitle}>Sales today</h2>
            <strong>{formatPrice(sales.reduce((sum, sale) => sum + sale.total, 0))}</strong>
          </div>
          {sales.length === 0 ? (
            <p className={extra.muted}>Nothing has been paid today.</p>
          ) : (
            <ul className={extra.salesList}>
              {sales.map((sale) => (
                <li key={sale.id} className={extra.saleRow}>
                  <span>
                    <strong>{sale.qty} × {sale.itemName}</strong>
                    <small>
                      {formatPrice(sale.unitPrice)} each
                    </small>
                  </span>
                  <strong>
                    {formatPrice(sale.unitPrice)} × {sale.qty} ={" "}
                    {formatPrice(sale.total)}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
