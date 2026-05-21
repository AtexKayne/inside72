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
  referrerPolicy: "no-referrer",
};

function useFineHover() {
  const [hasFineHover, setHasFineHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setHasFineHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return hasFineHover;
}

/**
 * @param {React.RefObject<HTMLElement | null>} ref
 * @param {string} [rootMargin]
 * @param {{ sticky?: boolean }} [options]
 */
function useInView(ref, rootMargin = "120px 0px", { sticky = false } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        setInView((prev) => {
          if (visible) return true;
          return sticky ? prev : false;
        });
      },
      { rootMargin, threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, sticky]);

  return inView;
}

/**
 * @param {{ videoUrl: string; hovered: boolean; hasFineHover: boolean; onWarm?: () => void }} props
 */
function StoryPreview({ videoUrl, hovered, hasFineHover, onWarm }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const srcPinnedRef = useRef(false);
  const inView = useInView(wrapRef, "120px 0px", { sticky: !hasFineHover });
  const shouldLoad = hasFineHover ? hovered || srcPinnedRef.current : inView;
  const shouldPlay = hasFineHover ? hovered : inView;

  useEffect(() => {
    srcPinnedRef.current = false;
  }, [videoUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (!shouldLoad) {
      el.pause();
      if (!hasFineHover) {
        el.removeAttribute("src");
        el.load();
        srcPinnedRef.current = false;
      }
      return;
    }

    if (el.getAttribute("src") !== videoUrl) {
      el.setAttribute("src", videoUrl);
      el.load();
    }
    if (hasFineHover) {
      srcPinnedRef.current = true;
    }
    onWarm?.();
  }, [videoUrl, shouldLoad, hasFineHover, onWarm]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !shouldPlay || !shouldLoad) {
      el?.pause();
      return;
    }

    let cancelled = false;

    const playPreview = () => {
      if (cancelled) return;
      const p = el.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {});
      }
    };

    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      playPreview();
    } else {
      el.addEventListener("canplay", playPreview, { once: true });
      el.addEventListener("loadeddata", playPreview, { once: true });
    }

    return () => {
      cancelled = true;
      el.removeEventListener("canplay", playPreview);
      el.removeEventListener("loadeddata", playPreview);
      el.pause();
    };
  }, [videoUrl, shouldPlay, shouldLoad]);

  return (
    <span ref={wrapRef} className={styles.previewWrap}>
      <video
        ref={videoRef}
        className={styles.preview}
        muted
        loop
        aria-hidden
        preload="none"
        {...VIDEO_PROPS}
      />
      <span className={styles.previewLogo} aria-hidden />
    </span>
  );
}

/**
 * @param {{ story: StoryItem; onOpen: () => void; onWarm?: () => void; hasFineHover: boolean }} props
 */
function StoryCircle({ story, onOpen, onWarm, hasFineHover }) {
  const [hovered, setHovered] = useState(false);

  const activate = () => {
    setHovered(true);
    onWarm?.();
  };

  return (
    <button
      type="button"
      className={styles.storyBtn}
      onClick={onOpen}
      onMouseEnter={activate}
      onMouseLeave={() => setHovered(false)}
      onFocus={activate}
      onBlur={() => setHovered(false)}
      aria-label={`Открыть сторис: ${story.title}`}
    >
      <span className={styles.ring} aria-hidden>
        <svg className={styles.ringSvg} viewBox="0 0 100 100" aria-hidden>
          <circle className={styles.ringTrack} cx="50" cy="50" r="48.5" pathLength="100" />
          <circle className={styles.ringProgress} cx="50" cy="50" r="48.5" pathLength="100" />
        </svg>
        <span className={styles.ringInner}>
          <StoryPreview
            videoUrl={story.videoUrl}
            hovered={hovered}
            hasFineHover={hasFineHover}
            onWarm={onWarm}
          />
        </span>
      </span>
    </button>
  );
}

/**
 * @param {{ items: StoryItem[] }} props
 */
const COLLAPSE_SCROLL_RANGE = 120;

export function SiteStories({ items = [] }) {
  /** @type {[number | null, React.Dispatch<React.SetStateAction<number | null>>]} */
  const [openIndex, setOpenIndex] = useState(null);
  /** @type {[Set<number>, React.Dispatch<React.SetStateAction<Set<number>>>]} */
  const [warmedIndices, setWarmedIndices] = useState(() => new Set());
  const [overlayAlive, setOverlayAlive] = useState(false);
  const wrapRef = useRef(null);
  const sectionRef = useRef(null);
  /** @type {React.MutableRefObject<(HTMLVideoElement | null)[]>} */
  const videoRefs = useRef([]);
  const hasFineHover = useFineHover();

  const warmStoryIndices = useCallback(
    (index) => {
      setWarmedIndices((prev) => {
        const next = new Set(prev);
        let changed = false;
        for (const i of [index - 1, index, index + 1]) {
          if (i >= 0 && i < items.length && !next.has(i)) {
            next.add(i);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    },
    [items.length]
  );

  const openStory = useCallback(
    (index) => {
      warmStoryIndices(index);
      setOverlayAlive(true);
      setOpenIndex(index);
    },
    [warmStoryIndices]
  );

  const close = useCallback(() => {
    setOpenIndex(null);
  }, []);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" && openIndex < items.length - 1) openStory(openIndex + 1);
      if (e.key === "ArrowLeft" && openIndex > 0) openStory(openIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, openIndex, items.length, openStory]);

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
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (openIndex === null || i !== openIndex) {
        v.pause();
        return;
      }
      v.currentTime = 0;
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    });
  }, [openIndex]);

  if (items.length === 0) {
    return null;
  }

  const active = openIndex !== null ? items[openIndex] : null;
  const overlayOpen = openIndex !== null;

  return (
    <>
      <div ref={wrapRef} className={styles.wrap} style={{
          "--stories-collapse": 0,
          "--story-logo-url": `url(${logoImage.src})`,
        }}>
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
                  <StoryCircle
                    story={story}
                    hasFineHover={hasFineHover}
                    onOpen={() => openStory(index)}
                    onWarm={() => warmStoryIndices(index)}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
          </section>
        </div>
        <div className={styles.compensator} aria-hidden />
      </div>

      {overlayAlive ? (
        <div
          className={`${styles.overlay} ${overlayOpen ? "" : styles.overlayHidden}`}
          role={overlayOpen ? "dialog" : undefined}
          aria-modal={overlayOpen ? "true" : undefined}
          aria-hidden={overlayOpen ? undefined : "true"}
          aria-label={active?.title}
          onClick={(e) => {
            if (overlayOpen && e.target === e.currentTarget) close();
          }}
        >
          <div className={styles.overlayInner}>
            <div className={styles.videoFrame}>
              <button type="button" className={styles.close} onClick={close} aria-label="Закрыть">
                ×
              </button>
              {openIndex !== null && openIndex > 0 ? (
                <button
                  type="button"
                  className={`${styles.nav} ${styles.navPrev}`}
                  aria-label="Предыдущее"
                  onClick={() => openStory(openIndex - 1)}
                >
                  ‹
                </button>
              ) : (
                <span className={`${styles.nav} ${styles.navPrev} ${styles.navHidden}`} aria-hidden />
              )}
              {openIndex !== null && openIndex < items.length - 1 ? (
                <button
                  type="button"
                  className={`${styles.nav} ${styles.navNext}`}
                  aria-label="Следующее"
                  onClick={() => openStory(openIndex + 1)}
                >
                  ›
                </button>
              ) : (
                <span className={`${styles.nav} ${styles.navNext} ${styles.navHidden}`} aria-hidden />
              )}
              {items.map((story, index) =>
                warmedIndices.has(index) ? (
                  <video
                    key={story.id}
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    className={styles.video}
                    data-active={index === openIndex ? "" : undefined}
                    src={story.videoUrl}
                    controls={index === openIndex}
                    controlsList="nodownload"
                    preload="auto"
                    {...VIDEO_PROPS}
                  />
                ) : null
              )}
            </div>
            {active ? <p className={styles.storyTitle}>{active.title}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
