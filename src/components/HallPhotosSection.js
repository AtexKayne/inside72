"use client";

import { useEffect, useState } from "react";
import { GalleryGrid } from "@/app/(site)/gallery/GalleryGrid";
import { getHallPhotosAlbum } from "@/lib/hall-photos";
import pages from "@/styles/pages.module.scss";
import styles from "./hall-photos-section.module.scss";

export function HallPhotosSection() {
  const [photos, setPhotos] = useState([]);
  const [albumTitle, setAlbumTitle] = useState("Зал");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [albumsRes, photosRes] = await Promise.all([
          fetch("/api/albums"),
          fetch("/api/photos"),
        ]);
        if (!albumsRes.ok || !photosRes.ok) return;
        const albumsJson = await albumsRes.json();
        const photosJson = await photosRes.json();
        if (cancelled) return;
        const { album, photos: hallPhotos } = getHallPhotosAlbum(
          albumsJson.items ?? [],
          photosJson.items ?? []
        );
        setAlbumTitle(album?.title ?? "Зал");
        setPhotos(hallPhotos);
      } catch (err) {
        console.error("[hall photos]", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="photos" className={`${pages.section} ${styles.section}`} aria-labelledby="photos-heading">
      <div className={pages.inner}>
        <header className={styles.header}>
          <p className={pages.pageKicker}>Залы</p>
          <h2 id="photos-heading" className={styles.title}>
            Фотографии зала
          </h2>
          <p className={styles.lead}>Два зала от 80 м² — зеркала, линолеум, раздевалки и душевые.</p>
        </header>

        {loading ? (
          <p className={styles.empty}>Загрузка фотографий…</p>
        ) : photos.length > 0 ? (
          <GalleryGrid items={photos} albumTitle={albumTitle} />
        ) : (
          <p className={styles.empty}>Фотографии скоро появятся.</p>
        )}
      </div>
    </section>
  );
}
