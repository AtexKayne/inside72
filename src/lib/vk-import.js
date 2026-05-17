import {
  getGroupOwnerId,
  getPhotosOwnerId,
  photoVkId,
  pickAlbumThumbUrl,
  pickLargestPhotoUrl,
  resolveVideoPlayUrl,
  videoApiId,
  videoVkId,
  vkCall,
  vkUserCall,
  wallPostVkId,
} from "@/lib/vk-api";
import { getVkImportedIds } from "@/lib/vk-import-store";

function stripVkMarkup(text) {
  return String(text ?? "")
    .replace(/\[([^\]|]+)\|([^\]]+)\]/g, "$2")
    .replace(/\[(id|club|public)\d+[^\]]*\]/gi, "")
    .trim();
}

function firstLine(text, maxLen = 120) {
  const line = text.split(/\n+/).find((l) => l.trim())?.trim() || text;
  if (line.length <= maxLen) return line;
  return `${line.slice(0, maxLen - 1).trim()}…`;
}

function excerptFrom(text, maxLen = 200) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= maxLen) return flat;
  return `${flat.slice(0, maxLen - 1).trim()}…`;
}

function postHasOnlyMedia(post) {
  const text = stripVkMarkup(post.text);
  if (text) return false;
  const atts = post.attachments ?? [];
  return atts.length > 0;
}

/** Прямые URL фотографий из вложений поста (порядок как в VK). */
function collectPhotoUrlsFromPost(post) {
  const urls = [];
  const seen = new Set();

  for (const att of post.attachments ?? []) {
    if (att.type !== "photo" || !att.photo) continue;

    const src = pickLargestPhotoUrl(att.photo.sizes);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    urls.push(src);
  }

  return urls;
}

async function fetchWallPosts(offset, count) {
  const ownerId = await getGroupOwnerId();
  const wall = await vkCall("wall.get", {
    owner_id: ownerId,
    offset,
    count,
    filter: "owner",
    extended: 1,
  });
  const posts = wall.items ?? [];
  return {
    ownerId,
    posts,
    hasMore: posts.length >= count,
    nextOffset: offset + count,
  };
}

function collectPhotosFromWall(posts, ownerId, imported) {
  const items = [];
  const seen = new Set();

  for (const post of posts) {
    const postText = stripVkMarkup(post.text);
    const postDate = post.date ? new Date(post.date * 1000).toISOString() : null;

    for (const att of post.attachments ?? []) {
      if (att.type !== "photo" || !att.photo) continue;

      const photo = att.photo;
      const src = pickLargestPhotoUrl(photo.sizes);
      if (!src) continue;

      const oid = photo.owner_id ?? ownerId;
      const vkId = photoVkId(oid, photo.id);
      if (seen.has(vkId)) continue;
      seen.add(vkId);

      const thumb =
        pickLargestPhotoUrl(
          photo.sizes?.filter((s) => (s.width || 0) <= 200) ?? photo.sizes
        ) || src;

      items.push({
        vkId,
        type: "photo",
        src,
        caption: stripVkMarkup(photo.text) || postText || "Фото из VK",
        previewUrl: thumb,
        date: photo.date ? new Date(photo.date * 1000).toISOString() : postDate,
        imported: imported.has(vkId),
      });
    }
  }

  return items;
}

/**
 * @param {Array<Record<string, unknown>>} rawVideos
 */
async function enrichWallVideos(rawVideos) {
  if (rawVideos.length === 0) return [];

  const needFetch = rawVideos.filter((v) => !resolveVideoPlayUrl(v));
  if (needFetch.length === 0) return rawVideos;

  try {
    const ids = needFetch.map((v) => videoApiId(v)).join(",");
    const data = await vkCall("video.get", { videos: ids });
    const byId = new Map();
    for (const item of data.items ?? []) {
      byId.set(`${item.owner_id}_${item.id}`, item);
    }
    return rawVideos.map((v) => {
      const key = `${v.owner_id}_${v.id}`;
      const full = byId.get(key);
      return full ? { ...v, ...full } : v;
    });
  } catch {
    return rawVideos;
  }
}

function collectVideosFromWall(posts, ownerId, imported) {
  const raw = [];
  const seen = new Set();

  for (const post of posts) {
    const postDate = post.date ? new Date(post.date * 1000).toISOString() : null;

    for (const att of post.attachments ?? []) {
      if (att.type !== "video" || !att.video) continue;

      const video = att.video;
      const oid = video.owner_id ?? ownerId;
      const vkId = videoVkId(oid, video.id);
      if (seen.has(vkId)) continue;
      seen.add(vkId);

      raw.push({
        ...video,
        owner_id: oid,
        postDate,
        vkId,
        imported: imported.has(vkId),
      });
    }
  }

  return raw;
}

/**
 * @param {number} offset
 * @param {number} count
 */
export async function fetchVkNewsPreview(offset = 0, count = 20) {
  const imported = await getVkImportedIds();
  const { ownerId, posts, hasMore, nextOffset } = await fetchWallPosts(offset, count);

  const items = [];
  for (const post of posts) {
    if (post.post_type && post.post_type !== "post") continue;
    const text = stripVkMarkup(post.text);
    if (!text && postHasOnlyMedia(post)) continue;
    if (!text) continue;

    const vkId = wallPostVkId(ownerId, post.id);
    const images = collectPhotoUrlsFromPost(post);
    items.push({
      vkId,
      type: "news",
      title: firstLine(text),
      excerpt: excerptFrom(text),
      body: text,
      images: images.length ? images : undefined,
      previewUrl: images[0] ?? undefined,
      date: post.date ? new Date(post.date * 1000).toISOString() : null,
      imported: imported.has(vkId),
    });
  }

  return { items, hasMore, nextOffset };
}

/**
 * Фото из вложений постов стены (photos.getAll недоступен с сервисным ключом).
 * @param {number} offset
 * @param {number} count — число постов стены за запрос
 */
export async function fetchVkPhotosPreview(offset = 0, count = 30) {
  const imported = await getVkImportedIds();
  const { ownerId, posts, hasMore, nextOffset } = await fetchWallPosts(offset, count);
  const items = collectPhotosFromWall(posts, ownerId, imported);

  return { items, hasMore, nextOffset };
}

function mapVkPhotoItem(photo, ownerId, imported, fallbackCaption = "Фото из VK") {
  const src = pickLargestPhotoUrl(photo.sizes);
  if (!src) return null;

  const oid = photo.owner_id ?? ownerId;
  const vkId = photoVkId(oid, photo.id);
  const thumb =
    pickLargestPhotoUrl(photo.sizes?.filter((s) => (s.width || 0) <= 200) ?? photo.sizes) || src;

  return {
    vkId,
    type: "photo",
    src,
    caption: stripVkMarkup(photo.text) || fallbackCaption,
    previewUrl: thumb,
    date: photo.date ? new Date(photo.date * 1000).toISOString() : null,
    imported: imported.has(vkId),
  };
}

/** Список альбомов сообщества (нужен VK_USER_TOKEN). */
export async function fetchVkAlbumsList() {
  const ownerId = await getPhotosOwnerId();
  const data = await vkUserCall("photos.getAlbums", {
    owner_id: ownerId,
    need_covers: 1,
    photo_sizes: 1,
  });

  const items = (data.items ?? []).map((album) => ({
    vkAlbumId: String(album.id),
    title: String(album.title ?? "").trim() || `Альбом ${album.id}`,
    size: album.size ?? 0,
    previewUrl: pickAlbumThumbUrl(album) ?? undefined,
  }));

  return { items, ownerId };
}

/**
 * Фото из альбома VK (нужен VK_USER_TOKEN).
 * @param {string} vkAlbumId
 * @param {number} offset
 * @param {number} count
 */
export async function fetchVkAlbumPhotosPreview(vkAlbumId, offset = 0, count = 50) {
  const ownerId = await getPhotosOwnerId();
  const imported = await getVkImportedIds();
  const albumId = String(vkAlbumId ?? "").trim();
  if (!albumId) {
    throw new Error("VK_ALBUM_ID_REQUIRED");
  }

  const data = await vkUserCall("photos.get", {
    owner_id: ownerId,
    album_id: albumId,
    offset,
    count: Math.min(Math.max(1, count), 100),
    photo_sizes: 1,
  });

  const items = [];
  const seen = new Set();
  for (const photo of data.items ?? []) {
    const item = mapVkPhotoItem(photo, ownerId, imported);
    if (!item || seen.has(item.vkId)) continue;
    seen.add(item.vkId);
    items.push(item);
  }

  const returned = data.items?.length ?? 0;
  const pageSize = Math.min(Math.max(1, count), 100);

  return {
    items,
    vkAlbumId: albumId,
    hasMore: returned >= pageSize,
    nextOffset: offset + returned,
  };
}

/**
 * Видео из вложений постов стены + video.get по id (video.get по owner_id с сервисным ключом пустой).
 * @param {number} offset
 * @param {number} count
 */
export async function fetchVkVideosPreview(offset = 0, count = 30) {
  const imported = await getVkImportedIds();
  const { ownerId, posts, hasMore, nextOffset } = await fetchWallPosts(offset, count);
  const raw = collectVideosFromWall(posts, ownerId, imported);
  const enriched = await enrichWallVideos(raw);

  const items = [];
  for (const video of enriched) {
    const videoUrl = resolveVideoPlayUrl(video);
    if (!videoUrl) continue;

    const thumb =
      pickLargestPhotoUrl(video.image) ||
      (typeof video.photo_320 === "string" ? video.photo_320 : null) ||
      (typeof video.photo_130 === "string" ? video.photo_130 : null);

    items.push({
      vkId: video.vkId,
      type: "video",
      title: String(video.title ?? "").trim() || "Видео из VK",
      videoUrl,
      previewUrl: thumb,
      duration: video.duration ?? null,
      date: video.date
        ? new Date(video.date * 1000).toISOString()
        : video.postDate,
      imported: video.imported,
    });
  }

  return { items, hasMore, nextOffset };
}

export function isAllowedVkMediaUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return (
      host.endsWith("userapi.com") ||
      host.endsWith("vkuser.net") ||
      host === "vk.com" ||
      host.endsWith(".vk.com") ||
      host.endsWith("vkvideo.ru") ||
      host.endsWith("mycdn.me")
    );
  } catch {
    return false;
  }
}
