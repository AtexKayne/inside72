"use client";

import { useCallback, useEffect, useState } from "react";
import g from "./gallery-grid.module.scss";

export function GalleryGrid({ items }) {
  const [index, setIndex] = useState(null);

  const close = useCallback(() => setIndex(null), []);
  const goPrev = useCallback(() => {
    setIndex((i) => (i != null && i > 0 ? i - 1 : i));
  }, []);
  const goNext = useCallback(() => {
    setIndex((i) => (i != null && i < items.length - 1 ? i + 1 : i));
  }, [items.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, goNext, goPrev, index]);

  useEffect(() => {
    if (index === null) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [index]);

  if (items.length === 0) return null;

  const active = index != null ? items[index] : null;

  return (
    <>
      <div className={g.grid}>
        {items.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            className={g.cell}
            onClick={() => setIndex(i)}
            aria-label={photo.caption || `Фото ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt=""
              className={g.thumb}
              loading="lazy"
              sizes="(min-width: 900px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
            <span className={g.cellOverlay} aria-hidden />
          </button>
        ))}
      </div>

      {active ? (
        <div
          className={g.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фотографии"
          onClick={close}
        >
          <button type="button" className={g.close} onClick={close} aria-label="Закрыть">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {index > 0 ? (
            <button
              type="button"
              className={`${g.nav} ${g.navPrev}`}
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Предыдущее фото"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path
                  d="M13 4L6 11l7 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}

          {index < items.length - 1 ? (
            <button
              type="button"
              className={`${g.nav} ${g.navNext}`}
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Следующее фото"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path
                  d="M9 4l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}

          <figure className={g.figure} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.src} alt="" className={g.lightboxImg} />
            {active.caption ? <figcaption className={g.caption}>{active.caption}</figcaption> : null}
            <span className={g.counter}>
              {index + 1} / {items.length}
            </span>
          </figure>
        </div>
      ) : null}
    </>
  );
}
