"use client";

import { useMemo, useState } from "react";
import { sortPhotosItems } from "@/lib/gallery-order";
import { GallerySwiper } from "./GallerySwiper";
import pages from "@/styles/pages.module.scss";
import g from "./gallery-albums.module.scss";

export function GalleryAlbums({ albums, photos }) {
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
    return <p className={pages.newsExcerpt}>Фотографии скоро появятся.</p>;
  }

  if (albumsWithPhotos.length === 1) {
    return <GallerySwiper items={albumsWithPhotos[0].photos} />;
  }

  return (
    <div className={g.root}>
      <div className={g.tabs} role="tablist" aria-label="Альбомы">
        {albumsWithPhotos.map((album) => (
          <button
            key={album.id}
            type="button"
            role="tab"
            aria-selected={active?.id === album.id}
            className={`${g.tab} ${active?.id === album.id ? g.tabActive : ""}`}
            onClick={() => setActiveId(album.id)}
          >
            {album.title}
            <span className={g.count}>{album.photos.length}</span>
          </button>
        ))}
      </div>
      {active ? (
        <div role="tabpanel" className={g.panel}>
          <GallerySwiper key={active.id} items={active.photos} />
        </div>
      ) : null}
    </div>
  );
}
