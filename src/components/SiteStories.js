"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import styles from "./site-stories.module.scss";
import logoImage from "../../public/logo.jpg";


/**
 * @typedef {{ id: string; title: string; videoUrl: string }} StoryItem
 */

const VIDEO_PROPS = {
  playsInline: true,
  preload: "metadata",
  referrerPolicy: "no-referrer",
};

function StoryPreview({ videoUrl }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const playPreview = () => {
      el.currentTime = 0;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    el.addEventListener("loadeddata", playPreview);
    if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      playPreview();
    }

    return () => el.removeEventListener("loadeddata", playPreview);
  }, [videoUrl]);

  return (
    <>
      <video
        ref={ref}
        className={styles.preview}
        src={videoUrl}
        muted
        loop
        aria-hidden
        {...VIDEO_PROPS}
      />
      <span className={styles.previewLogo} aria-hidden>
        <img src={logoImage.src} alt="" />
      </span>
    </>
  );
}

/**
 * @param {{ items: StoryItem[] }} props
 */
const COLLAPSE_SCROLL_RANGE = 120;

export function SiteStories({ items = [] }) {
  /** @type {[number | null, React.Dispatch<React.SetStateAction<number | null>>]} */
  const [openIndex, setOpenIndex] = useState(null);
  const wrapRef = useRef(null);
  const sectionRef = useRef(null);
  const videoRef = useRef(null);

  const close = useCallback(() => {
    setOpenIndex(null);
  }, []);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" && openIndex < items.length - 1) setOpenIndex(openIndex + 1);
      if (e.key === "ArrowLeft" && openIndex > 0) setOpenIndex(openIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, openIndex, items.length]);

  useEffect(() => {
    if (openIndex === null) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openIndex]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const section = sectionRef.current;
    if (!wrap || !section) return;

    let raf = 0;

    let lastCollapse = -1;

    const updateCollapse = () => {
      const y = window.scrollY;
      const collapse = Math.min(1, Math.max(0, y / COLLAPSE_SCROLL_RANGE));
      if (Math.abs(collapse - lastCollapse) < 0.01) return;
      lastCollapse = collapse;
      wrap.style.setProperty("--stories-collapse", String(collapse));
      if (collapse > 0.02) {
        section.dataset.collapsed = "";
      } else {
        delete section.dataset.collapsed;
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateCollapse);
    };

    updateCollapse();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (openIndex === null) return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [openIndex]);

  if (items.length === 0) {
    return null;
  }

  const active = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      <div ref={wrapRef} className={styles.wrap} style={{ "--stories-collapse": 0 }}>
        <div className={styles.anchor}>
          <section
            ref={sectionRef}
            className={styles.section}
            aria-label="Сторис студии"
          >
        <div className={styles.inner}>
          <div className={styles.collapseInner}>
            <Swiper
              className={styles.row}
              modules={[FreeMode]}
              slidesPerView="auto"
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
            >
              {items.map((story, index) => (
                <SwiperSlide key={story.id} className={styles.slide}>
                  <button
                    type="button"
                    className={styles.storyBtn}
                    onClick={() => setOpenIndex(index)}
                    aria-label={`Открыть сторис: ${story.title}`}
                  >
                    <span className={styles.ring} aria-hidden>
                      <span className={styles.ringInner}>
                        <StoryPreview videoUrl={story.videoUrl} />
                      </span>
                    </span>
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
          </section>
        </div>
        <div className={styles.compensator} aria-hidden />
      </div>

      {active ? (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className={styles.overlayInner}>
            <div className={styles.videoFrame}>
              <button type="button" className={styles.close} onClick={close} aria-label="Закрыть">
                ×
              </button>
              {openIndex > 0 ? (
                <button
                  type="button"
                  className={`${styles.nav} ${styles.navPrev}`}
                  aria-label="Предыдущее"
                  onClick={() => setOpenIndex((i) => (i !== null ? i - 1 : i))}
                >
                  ‹
                </button>
              ) : (
                <span className={`${styles.nav} ${styles.navPrev} ${styles.navHidden}`} aria-hidden />
              )}
              {openIndex < items.length - 1 ? (
                <button
                  type="button"
                  className={`${styles.nav} ${styles.navNext}`}
                  aria-label="Следующее"
                  onClick={() => setOpenIndex((i) => (i !== null ? i + 1 : i))}
                >
                  ›
                </button>
              ) : (
                <span className={`${styles.nav} ${styles.navNext} ${styles.navHidden}`} aria-hidden />
              )}
              <video
                ref={videoRef}
                key={active.id}
                className={styles.video}
                src={active.videoUrl}
                controls
                controlsList="nodownload"
                {...VIDEO_PROPS}
              />
            </div>
            <p className={styles.storyTitle}>{active.title}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
