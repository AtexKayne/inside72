"use client";

import { useId, useState } from "react";
import styles from "./form-contact-tabs.module.scss";

const TABS = [
  { id: "application", label: "Заявка на сайте" },
  { id: "direct", label: "Написать Александру" },
];

/**
 * @param {{
 *   idPrefix?: string;
 *   application: import("react").ReactNode;
 *   direct: import("react").ReactNode;
 *   defaultTab?: "application" | "direct";
 * }} props
 */
export function FormContactTabs({
  idPrefix = "form",
  application,
  direct,
  defaultTab = "application",
}) {
  const baseId = useId().replace(/:/g, "");
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className={styles.root}>
      <div className={styles.tablist} role="tablist" aria-label="Способ связи">
        {TABS.map((tab) => {
          const tabId = `${idPrefix}-${baseId}-tab-${tab.id}`;
          const panelId = `${idPrefix}-${baseId}-panel-${tab.id}`;
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={tabId}
              className={`${styles.tab} ${selected ? styles.tabActive : ""}`}
              aria-selected={selected}
              aria-controls={panelId}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {TABS.map((tab) => {
        const tabId = `${idPrefix}-${baseId}-tab-${tab.id}`;
        const panelId = `${idPrefix}-${baseId}-panel-${tab.id}`;
        const selected = activeTab === tab.id;

        return (
          <div
            key={tab.id}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!selected}
            className={`${styles.panel} ${selected ? "" : styles.panelHidden}`}
          >
            {tab.id === "application" ? application : direct}
          </div>
        );
      })}
    </div>
  );
}
