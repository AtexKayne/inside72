import { sortPhotosItems } from "@/lib/gallery-order";

/** Альбом с фотографиями залов (см. админку / галерею). */
export const HALL_PHOTOS_ALBUM_ID = "alb-1779038479422";

/**
 * @param {{ id: string; title?: string }[]} albums
 * @param {{ albumId: string }[]} photos
 * @returns {{ album: { id: string; title: string } | null; photos: typeof photos }}
 */
export function getHallPhotosAlbum(albums, photos) {
  const byId = albums.find((a) => a.id === HALL_PHOTOS_ALBUM_ID);
  const byTitle = albums.find((a) => /зал/i.test(String(a.title ?? "")));
  const album = byId ?? byTitle ?? null;
  if (!album) {
    return { album: null, photos: [] };
  }
  return {
    album,
    photos: sortPhotosItems(photos.filter((p) => p.albumId === album.id)),
  };
}
