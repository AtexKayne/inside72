"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import { ReviewPlatformIcon } from "@/components/ReviewPlatformIcon";
import { hallRentalInfo } from "@/lib/hall-rental";
import { siteContacts } from "@/lib/site-contacts";
import pages from "@/styles/pages.module.scss";
import styles from "./hall-rental-info-tabs.module.scss";

const REVIEW_LINKS = [
  {
    id: "avito",
    label: "Отзывы на Авито",
    href: "https://www.avito.ru/tyumen/predlozheniya_uslug/arenda_tantsevalnogo_zala_82m_3465509060?context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJLcmJ2b2RySWZHUHczOFFYIjt9UO2Pyz8AAAA#open-reviews-list",
  },
  {
    id: "yandex",
    label: "Отзывы в Яндекс Картах",
    href: "https://yandex.ru/maps/org/inside/215505832487/reviews/?indoorLevel=1&ll=65.537427%2C57.148693&z=17",
  },
  {
    id: "vk",
    label: "Отзывы ВКонтакте",
    href: "https://vk.com/reviews-222803928",
  },
  {
    id: "2gis",
    label: "Отзывы в 2ГИС",
    href: "https://2gis.ru/tyumen/firm/70000001081277719/tab/reviews",
  },
];

const TABS = [
  { id: "pricing", label: "Цены" },
  { id: "schedule", label: "Постоянная аренда" },
  { id: "about", label: "О зале" },
  { id: "conditions", label: "Условия и адрес" },
];

const DESKTOP_MQ = "(min-width: 900px)";

function TabButton({ tab, activeId, onSelect }) {
  return (
    <button
      type="button"
      role="tab"
      id={`hall-tab-${tab.id}`}
      aria-selected={activeId === tab.id}
      aria-controls={`hall-panel-${tab.id}`}
      className={`${styles.tab} ${activeId === tab.id ? styles.tabActive : ""}`}
      onClick={() => onSelect(tab.id)}
    >
      {tab.label}
    </button>
  );
}

export function HallRentalInfoTabs() {
  const [activeId, setActiveId] = useState("pricing");
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileSwiperReady, setMobileSwiperReady] = useState(false);
  const swiperRef = useRef(null);
  const info = hallRentalInfo;

  const scheduleSwiperUpdate = useCallback(() => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => swiper.update());
    });
  }, []);

  useLayoutEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);

    const sync = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      if (desktop) {
        setMobileSwiperReady(false);
        return;
      }
      setMobileSwiperReady(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMobileSwiperReady(true));
      });
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const handleSelect = (id) => setActiveId(id);

  const tabListProps = {
    role: "tablist",
    "aria-label": "Информация об аренде",
  };

  return (
    <div className={styles.root}>
      <div className={styles.tablistWrap}>
        <div className={styles.tabsTrack}>
          {isDesktop ? (
            <div className={styles.tabsFlex} {...tabListProps}>
              {TABS.map((tab) => (
                <TabButton key={tab.id} tab={tab} activeId={activeId} onSelect={handleSelect} />
              ))}
            </div>
          ) : mobileSwiperReady ? (
            <Swiper
              className={styles.tabsSwiper}
              modules={[FreeMode]}
              slidesPerView="auto"
              spaceBetween={4}
              freeMode={{
                enabled: true,
                momentum: true,
                momentumRatio: 0.8,
                momentumVelocityRatio: 0.8,
              }}
              speed={400}
              grabCursor
              watchOverflow
              touchStartPreventDefault={false}
              observer
              observeParents
              resizeObserver
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                scheduleSwiperUpdate();
              }}
              onDestroy={() => {
                swiperRef.current = null;
              }}
              {...tabListProps}
            >
              {TABS.map((tab) => (
                <SwiperSlide key={tab.id} className={styles.tabSlide}>
                  <TabButton tab={tab} activeId={activeId} onSelect={handleSelect} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className={styles.tabsScrollFallback} {...tabListProps}>
              {TABS.map((tab) => (
                <TabButton key={tab.id} tab={tab} activeId={activeId} onSelect={handleSelect} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`hall-panel-${activeId}`}
        aria-labelledby={`hall-tab-${activeId}`}
        className={styles.panel}
      >
        <div key={activeId} className={styles.panelInner}>
          {activeId === "pricing" ? (
            <>
              <ul className={styles.priceList}>
                {info.pricing.map((row) => (
                  <li key={row.label} className={styles.priceRow}>
                    <span className={styles.priceLabel}>{row.label}</span>
                    <span className={styles.priceValue}>{row.price}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.reviewsBlock}>
                <p className={styles.subheading}>Отзывы о студии</p>
                <div className={styles.reviewIcons} role="group" aria-label="Отзывы на площадках">
                  {REVIEW_LINKS.map((link) => (
                    <a
                      key={link.id}
                      href={link.href}
                      className={styles.iconBtn}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      title={link.label}
                    >
                      <span className={styles.iconBtnInner}>
                        <ReviewPlatformIcon platform={link.id} />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {activeId === "schedule" ? (
            <>
              <p className={styles.hint}>
                Постоянная аренда — выберите зал и свободные слоты в календаре выше.
              </p>
              <div className={styles.scheduleGrid}>
                {info.recurringSlots.map((slot) => (
                  <div key={slot.day} className={styles.scheduleRow}>
                    <span className={styles.day}>{slot.day}</span>
                    <span className={styles.scheduleTimes}>{slot.times}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {activeId === "about" ? (
            <>
              <ul className={styles.list}>
                {info.amenities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className={styles.actions}>
                <Link className={`${pages.btn} ${pages.btnGhost}`} href="/gallery#alb-1779038479422">
                  Посмотреть фото
                </Link>
              </div>
            </>
          ) : null}

          {activeId === "conditions" ? (
            <>
              <ul className={styles.list}>
                {info.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
              <p className={`${styles.subheading} ${styles.subheadingSpaced}`}>Адрес</p>
              <p className={styles.address}>
                {info.address.line}
                <br />
                {info.address.entry}
              </p>
              <div className={styles.actions}>
                <Link className={`${pages.btn} ${pages.btnGhost}`} href="/about#contacts">
                  Контакты и схема проезда
                </Link>
              </div>
              <p className={`${styles.subheading} ${styles.subheadingSpaced}`}>Парковка</p>
              <p className={styles.address}>{info.parking}</p>
              <p className={`${styles.subheading} ${styles.subheadingSpaced}`}>Связь</p>
              <p className={styles.address}>
                <a href={siteContacts.vk.url} target="_blank" rel="noopener noreferrer">
                  ВКонтакте
                </a>
                {" · "}
                <a href={`tel:${siteContacts.phone.tel}`}>{siteContacts.phone.display}</a>
                <span className={styles.bookingNote}>{info.bookingNote}</span>
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
