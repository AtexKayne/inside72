"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./site-stories.module.scss";
import logoImage from "../../public/logo.jpg";
import { getStoryPreviewVideoUrl, getStorySlides } from "@/lib/story-slides";

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
  const inView = useInView(wrapRef, "120px 240px", { sticky: !hasFineHover });
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

  if (!videoUrl) return null;

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
 * @param {{ story: import("@/lib/story-slides").StoryItem; onOpen: () => void; onWarm?: () => void; hasFineHover: boolean }} props
 */
function StoryCircle({ story, onOpen, onWarm, hasFineHover }) {
  const [hovered, setHovered] = useState(false);
  const previewUrl = getStoryPreviewVideoUrl(story);

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
      title={story.title || undefined}
    >
      <span className={styles.ring} aria-hidden>
        <svg className={styles.ringSvg} viewBox="0 0 100 100" aria-hidden>
          <circle className={styles.ringTrack} cx="50" cy="50" r="48.5" pathLength="100" />
          <circle className={styles.ringProgress} cx="50" cy="50" r="48.5" pathLength="100" />
        </svg>
        <span className={styles.ringInner}>
          <StoryPreview
            videoUrl={previewUrl}
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
 * @param {{ count: number; activeIndex: number; progress: number }} props
 */
function StoryProgress({ count, activeIndex, progress }) {
  if (count <= 1) return null;

  return (
    <div className={styles.progressRow} aria-hidden>
      {Array.from({ length: count }, (_, index) => {
        let fill = 0;
        if (index < activeIndex) fill = 100;
        else if (index === activeIndex) fill = progress;

        return (
          <span key={index} className={styles.progressSegment}>
            <span className={styles.progressFill} style={{ width: `${fill}%` }} />
          </span>
        );
      })}
    </div>
  );
}

const COLLAPSE_SCROLL_RANGE = 120;

/**
 * @param {{ items: import("@/lib/story-slides").StoryItem[] }} props
 */
export function SiteStories({ items = [] }) {
  /** @type {[number | null, React.Dispatch<React.SetStateAction<number | null>>]} */
  const [openIndex, setOpenIndex] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);
  /** @type {[Set<string>, React.Dispatch<React.SetStateAction<Set<string>>>]} */
  const [warmedKeys, setWarmedKeys] = useState(() => new Set());
  const [overlayAlive, setOverlayAlive] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  const wrapRef = useRef(null);
  const sectionRef = useRef(null);
  /** @type {React.MutableRefObject<Record<string, HTMLVideoElement | null>>} */
  const videoRefs = useRef({});
  const activeVideoRef = useRef(null);
  const hasFineHover = useFineHover();

  const getSlides = useCallback((index) => getStorySlides(items[index]), [items]);

  const warmStoryKeys = useCallback(
    (index) => {
      setWarmedKeys((prev) => {
        const next = new Set(prev);
        let changed = false;

        for (const storyOffset of [-1, 0, 1]) {
          const storyIndex = index + storyOffset;
          if (storyIndex < 0 || storyIndex >= items.length) continue;
          const slides = getSlides(storyIndex);
          slides.forEach((_, slideIdx) => {
            const key = `${storyIndex}-${slideIdx}`;
            if (!next.has(key)) {
              next.add(key);
              changed = true;
            }
          });
        }

        return changed ? next : prev;
      });
    },
    [getSlides, items.length]
  );

  const openStory = useCallback(
    (index, nextSlideIndex = 0) => {
      warmStoryKeys(index);
      setOverlayAlive(true);
      setOpenIndex(index);
      setSlideIndex(nextSlideIndex);
      setSlideProgress(0);
    },
    [warmStoryKeys]
  );

  const close = useCallback(() => {
    setOpenIndex(null);
    setSlideIndex(0);
    setSlideProgress(0);
  }, []);

  const goNext = useCallback(() => {
    if (openIndex === null) return;
    const slides = getSlides(openIndex);
    if (slideIndex < slides.length - 1) {
      setSlideIndex((prev) => prev + 1);
      setSlideProgress(0);
      return;
    }
    if (openIndex < items.length - 1) {
      openStory(openIndex + 1, 0);
    }
  }, [getSlides, items.length, openIndex, openStory, slideIndex]);

  const goPrev = useCallback(() => {
    if (openIndex === null) return;
    if (slideIndex > 0) {
      setSlideIndex((prev) => prev - 1);
      setSlideProgress(0);
      return;
    }
    if (openIndex > 0) {
      const prevSlides = getSlides(openIndex - 1);
      openStory(openIndex - 1, Math.max(prevSlides.length - 1, 0));
    }
  }, [getSlides, openIndex, openStory, slideIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, goNext, goPrev, openIndex]);

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
    Object.entries(videoRefs.current).forEach(([key, video]) => {
      if (!video) return;
      const [storyIdx, slideIdx] = key.split("-").map(Number);
      const isActive = openIndex === storyIdx && slideIndex === slideIdx;
      if (openIndex === null || !isActive) {
        video.pause();
        return;
      }
      video.currentTime = 0;
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    });
  }, [openIndex, slideIndex]);

  useEffect(() => {
    const video = activeVideoRef.current;
    if (!video || openIndex === null) {
      setSlideProgress(0);
      return;
    }

    const updateProgress = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        setSlideProgress(0);
        return;
      }
      setSlideProgress(Math.min(100, (video.currentTime / duration) * 100));
    };

    const onEnded = () => {
      goNext();
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("durationchange", updateProgress);
    video.addEventListener("ended", onEnded);
    updateProgress();

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("durationchange", updateProgress);
      video.removeEventListener("ended", onEnded);
    };
  }, [goNext, openIndex, slideIndex]);

  if (items.length === 0) {
    return null;
  }

  const activeStory = openIndex !== null ? items[openIndex] : null;
  const activeSlides = activeStory ? getStorySlides(activeStory) : [];
  const overlayOpen = openIndex !== null;
  const canGoPrev = openIndex !== null && (slideIndex > 0 || openIndex > 0);
  const canGoNext =
    openIndex !== null &&
    (slideIndex < activeSlides.length - 1 || openIndex < items.length - 1);

  return (
    <>
      <div
        ref={wrapRef}
        className={styles.wrap}
        style={{
          "--stories-collapse": 0,
          "--story-logo-url": `url(${logoImage.src})`,
        }}
      >
        <div className={styles.anchor}>
          <section ref={sectionRef} className={styles.section} aria-label="Сторис студии">
            <div className={styles.inner}>
              <div className={styles.collapseInner}>
                <div className={styles.rowOuter}>
                  <div className={styles.row} role="list" aria-label="Сторис">
                    {items.map((story, index) => (
                      <div key={story.id} className={styles.slide} role="listitem">
                        <StoryCircle
                          story={story}
                          hasFineHover={hasFineHover}
                          onOpen={() => openStory(index, 0)}
                          onWarm={() => warmStoryKeys(index)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
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
          aria-label={activeStory?.title}
          onClick={(e) => {
            if (overlayOpen && e.target === e.currentTarget) close();
          }}
        >
          <div className={styles.overlayInner}>
            <div className={styles.videoFrame}>
              <StoryProgress
                count={activeSlides.length}
                activeIndex={slideIndex}
                progress={slideProgress}
              />

              <button type="button" className={styles.close} onClick={close} aria-label="Закрыть">
                ×
              </button>

              {canGoPrev ? (
                <button
                  type="button"
                  className={`${styles.nav} ${styles.navPrev}`}
                  aria-label="Предыдущее"
                  onClick={goPrev}
                >
                  ‹
                </button>
              ) : (
                <span className={`${styles.nav} ${styles.navPrev} ${styles.navHidden}`} aria-hidden />
              )}

              {canGoNext ? (
                <button
                  type="button"
                  className={`${styles.nav} ${styles.navNext}`}
                  aria-label="Следующее"
                  onClick={goNext}
                >
                  ›
                </button>
              ) : (
                <span className={`${styles.nav} ${styles.navNext} ${styles.navHidden}`} aria-hidden />
              )}

              <button
                type="button"
                className={`${styles.tapZone} ${styles.tapPrev}`}
                aria-label="Предыдущий слайд"
                onClick={goPrev}
                tabIndex={-1}
              />
              <button
                type="button"
                className={`${styles.tapZone} ${styles.tapNext}`}
                aria-label="Следующий слайд"
                onClick={goNext}
                tabIndex={-1}
              />

              {items.map((story, storyIdx) =>
                getSlides(storyIdx).map((slide, slideIdx) => {
                  const key = `${storyIdx}-${slideIdx}`;
                  if (!warmedKeys.has(key)) return null;
                  const isActive = openIndex === storyIdx && slideIndex === slideIdx;

                  return (
                    <video
                      key={`${story.id}-${slideIdx}`}
                      ref={(el) => {
                        videoRefs.current[key] = el;
                        if (isActive) activeVideoRef.current = el;
                      }}
                      className={styles.video}
                      data-active={isActive ? "" : undefined}
                      src={slide.videoUrl}
                      controls={isActive}
                      controlsList="nodownload"
                      preload="auto"
                      {...VIDEO_PROPS}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
