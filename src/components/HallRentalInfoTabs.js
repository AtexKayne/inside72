"use client";

import { useState } from "react";
import { hallRentalInfo } from "@/lib/hall-rental";
import { siteContacts } from "@/lib/site-contacts";
import styles from "./hall-rental-info-tabs.module.scss";

const TABS = [
  { id: "pricing", label: "Цены" },
  { id: "schedule", label: "Постоянная аренда" },
  { id: "about", label: "О зале" },
  { id: "conditions", label: "Условия и адрес" },
];

export function HallRentalInfoTabs() {
  const [activeId, setActiveId] = useState("pricing");
  const info = hallRentalInfo;

  return (
    <div className={styles.root}>
      <div className={styles.tabs} role="tablist" aria-label="Информация об аренде">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeId === tab.id}
            className={`${styles.tab} ${activeId === tab.id ? styles.tabActive : ""}`}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className={styles.panel}>
        {activeId === "pricing" ? (
          <ul className={styles.list} style={{ listStyle: "none", padding: 0 }}>
            {info.pricing.map((row) => (
              <li key={row.label} className={styles.priceRow}>
                <span className={styles.priceLabel}>{row.label}</span>
                <span className={styles.priceValue}>{row.price}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {activeId === "schedule" ? (
          <>
            <p className={styles.hint}>{info.notice}</p>
            <p className={styles.hint} style={{ marginBottom: "1.25rem" }}>
              Разовая аренда — свободные слоты в календаре выше. По датам дальше недели пишите в
              сообщениях.
            </p>
            {info.recurringSlots.map((slot) => (
              <div key={slot.day} className={styles.scheduleRow}>
                <span className={styles.day}>{slot.day}</span>
                <span>{slot.times}</span>
              </div>
            ))}
          </>
        ) : null}

        {activeId === "about" ? (
          <ul className={styles.list}>
            {info.amenities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}

        {activeId === "conditions" ? (
          <>
            <ul className={styles.list}>
              {info.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <p className={styles.subheading}>Адрес</p>
            <p className={styles.address}>
              {info.address.line}
              <br />
              {info.address.entry}
            </p>
            <p className={styles.subheading}>Парковка</p>
            <p className={styles.address}>{info.parking}</p>
            <p className={styles.subheading}>Связь</p>
            <p className={styles.address} style={{ marginBottom: 0 }}>
              <a href={siteContacts.vk.url} target="_blank" rel="noopener noreferrer">
                ВКонтакте
              </a>
              {" · "}
              <a href={`tel:${siteContacts.phone.tel}`}>{siteContacts.phone.display}</a>
              <br />
              <span style={{ fontSize: "0.88rem" }}>{info.bookingNote}</span>
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
