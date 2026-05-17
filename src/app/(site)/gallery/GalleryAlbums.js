"use client";

import { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import { sortPhotosItems } from "@/lib/gallery-order";
import { GalleryGrid } from "./GalleryGrid";
import g from "./gallery-albums.module.scss";

/** Container side gutter (1.25rem at 16px root) — mobile full-bleed alignment only */
const MOBILE_SLIDE_GUTTER_PX = 20;
const MOBILE_MQ = "(max-width: 899px)";

export function GalleryAlbums({ albums, photos }) {
  const [slideGutter, setSlideGutter] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setSlideGutter(mq.matches ? MOBILE_SLIDE_GUTTER_PX : 0);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const albumsWithPhotos = useMemo(() => {
    const byAlbum = new Map(albums.map((a) => [a.id, []]));
    for (const photo of photos) {
      const list = byAlbum.get(photo.albumId);
      if (list) list.push(photo);
    }
    return albums
      .map((album) => ({
        ...album,
        photos: sortPhotosItems(byAlbum.get(album.id) ?? []),
      }))
      .filter((a) => a.photos.length > 0);
  }, [albums, photos]);

  const [activeId, setActiveId] = useState(() => albumsWithPhotos[0]?.id ?? null);

  const active =
    albumsWithPhotos.find((a) => a.id === activeId) ?? albumsWithPhotos[0] ?? null;

  if (albumsWithPhotos.length === 0) {
    return <p className={g.empty}>Фотографии скоро появятся.</p>;
  }

  return (
    <div className={g.root}>
      {albumsWithPhotos.length > 1 ? (
        <div className={g.albumBar}>
          <p className={g.albumLabel} id="gallery-albums-label">
            Альбомы
          </p>
          <div className={g.albumBarScroll}>
            <Swiper
              className={g.tabsSwiper}
              modules={[FreeMode]}
              slidesPerView="auto"
              spaceBetween={10}
              slidesOffsetBefore={slideGutter}
              slidesOffsetAfter={slideGutter}
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
              role="tablist"
              aria-labelledby="gallery-albums-label"
            >
              {albumsWithPhotos.map((album) => {
                const cover = album.photos[0]?.src;
                const isActive = active?.id === album.id;
                return (
                  <SwiperSlide key={album.id} className={g.tabSlide}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`${g.tab} ${isActive ? g.tabActive : ""}`}
                      onClick={() => setActiveId(album.id)}
                    >
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" className={g.thumb} />
                      ) : null}
                      <span className={g.tabText}>
                        <span className={g.tabTitle}>{album.title}</span>
                        <span className={g.count}>{album.photos.length} фото</span>
                      </span>
                    </button>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </div>
      ) : null}

      {active ? (
        <div role="tabpanel" className={g.panel} key={active.id}>
          <GalleryGrid items={active.photos} />
        </div>
      ) : null}
    </div>
  );
}
