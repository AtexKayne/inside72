"use client";

import { useMemo, useState } from "react";
import { sortPhotosItems } from "@/lib/gallery-order";
import { GalleryGrid } from "./GalleryGrid";
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
    return <p className={g.empty}>Фотографии скоро появятся.</p>;
  }

  return (
    <div className={g.root}>
      {albumsWithPhotos.length > 1 ? (
        <div className={g.albumBar}>
          <p className={g.albumLabel} id="gallery-albums-label">
            Альбомы
          </p>
          <div className={g.tabs} role="tablist" aria-labelledby="gallery-albums-label">
            {albumsWithPhotos.map((album) => {
              const cover = album.photos[0]?.src;
              const isActive = active?.id === album.id;
              return (
                <button
                  key={album.id}
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
              );
            })}
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
