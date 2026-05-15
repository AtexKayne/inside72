import { getAlbums, getPhotos } from "@/lib/data-store";
import { GalleryAlbums } from "./GalleryAlbums";
import pages from "@/styles/pages.module.scss";

export const revalidate = 30;

export const metadata = {
  title: "Фотографии",
  description: "Фотографии со занятий и мероприятий студии Inside.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const [albums, photos] = await Promise.all([getAlbums(), getPhotos()]);

  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <h1 className={pages.h2}>Фотографии</h1>
        <p className={pages.lead} style={{ marginBottom: "2rem" }}>
          Моменты из зала: занятия, показы и атмосфера студии.
        </p>
        <GalleryAlbums albums={albums} photos={photos} />
      </div>
    </section>
  );
}
