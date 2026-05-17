import { getAlbums, getPhotos } from "@/lib/data-store";
import { GalleryAlbums } from "./GalleryAlbums";
import pages from "@/styles/pages.module.scss";
import styles from "./gallery-page.module.scss";

export const revalidate = 30;

export const metadata = {
  title: "Фотографии",
  description: "Фотографии со занятий и мероприятий студии Inside.",
  alternates: { canonical: "/gallery" },
};

function pluralAlbums(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "альбомов";
  if (mod10 === 1) return "альбом";
  if (mod10 >= 2 && mod10 <= 4) return "альбома";
  return "альбомов";
}

function pluralPhotos(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "фотографий";
  if (mod10 === 1) return "фотография";
  if (mod10 >= 2 && mod10 <= 4) return "фотографии";
  return "фотографий";
}

export default async function GalleryPage() {
  const [albums, photos] = await Promise.all([getAlbums(), getPhotos()]);

  const albumIds = new Set(albums.map((a) => a.id));
  const visiblePhotos = photos.filter((p) => albumIds.has(p.albumId));
  const albumCount = albums.filter((a) =>
    visiblePhotos.some((p) => p.albumId === a.id)
  ).length;

  return (
    <section className={`${pages.section} ${styles.gallerySection}`}>
      <div className={pages.inner}>
        <header className={pages.pageHero}>
          <p className={pages.pageKicker}>Студия Inside</p>
          <h1 className={pages.pageTitle}>Фотографии</h1>
          <p className={pages.pageLead}>
            Моменты из зала: занятия, показы и атмосфера студии.
          </p>
          {visiblePhotos.length > 0 ? (
            <div className={styles.meta}>
              {albumCount > 0 ? (
                <span className={styles.metaItem}>
                  {albumCount} {pluralAlbums(albumCount)}
                </span>
              ) : null}
              <span className={styles.metaItem}>
                {visiblePhotos.length} {pluralPhotos(visiblePhotos.length)}
              </span>
            </div>
          ) : null}
        </header>

        <GalleryAlbums albums={albums} photos={photos} />
      </div>
    </section>
  );
}
