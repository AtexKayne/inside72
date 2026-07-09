import fs from "fs/promises";
import path from "path";
import { sortAlbumsItems, sortPhotosItems } from "@/lib/gallery-order";
import { createDefaultPricingContent, normalizePricingContent } from "@/lib/pricing-content";
import { sortStoriesItems } from "@/lib/story-order";

const DATA_DIR = path.join(process.cwd(), "data");

export const DEFAULT_ALBUM_ID = "alb-default";

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), "utf-8");
}

function sortByCreatedAtDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getNews() {
  const data = await readJson("news.json", { items: [] });
  return sortByCreatedAtDesc(data.items);
}

export async function addNews(item) {
  const data = await readJson("news.json", { items: [] });
  const news = {
    ...item,
    id: `n-${Date.now()}`,
    createdAt: item.createdAt || new Date().toISOString(),
  };
  if (item.vkId) {
    news.vkId = item.vkId;
  }
  if (Array.isArray(item.images) && item.images.length) {
    news.images = item.images.filter((u) => typeof u === "string" && u.trim());
  }
  data.items.unshift(news);
  await writeJson("news.json", data);
  return news;
}

export async function updateNews(id, { title, excerpt, body, images }) {
  const newsId = String(id ?? "").trim();
  if (!newsId) return null;

  const data = await readJson("news.json", { items: [] });
  const idx = data.items.findIndex((n) => n.id === newsId);
  if (idx === -1) return null;

  const item = data.items[idx];
  const updated = {
    ...item,
    title: String(title ?? item.title).trim(),
    excerpt: String(excerpt ?? item.excerpt).trim(),
    body: String(body ?? item.body).trim(),
    updatedAt: new Date().toISOString(),
  };
  if (images !== undefined) {
    const urls = Array.isArray(images)
      ? images.filter((u) => typeof u === "string" && u.trim()).map((u) => u.trim())
      : [];
    if (urls.length) {
      updated.images = urls;
    } else {
      delete updated.images;
    }
  }
  data.items[idx] = updated;
  await writeJson("news.json", data);
  return updated;
}

export async function deleteNews(id) {
  const newsId = String(id ?? "").trim();
  if (!newsId) return false;

  const data = await readJson("news.json", { items: [] });
  const had = data.items.some((n) => n.id === newsId);
  if (!had) return false;

  data.items = data.items.filter((n) => n.id !== newsId);
  await writeJson("news.json", data);
  return true;
}

export async function getAlbums() {
  const data = await readJson("albums.json", { items: [] });
  return sortAlbumsItems(data.items);
}

export async function getAlbumById(id) {
  const albums = await getAlbums();
  return albums.find((a) => a.id === id) ?? null;
}

export async function addAlbum({ title }) {
  const data = await readJson("albums.json", { items: [] });
  for (const a of data.items) {
    a.sortOrder = (a.sortOrder ?? 0) + 1;
  }
  const album = {
    id: `alb-${Date.now()}`,
    title: String(title ?? "").trim(),
    sortOrder: 0,
    createdAt: new Date().toISOString(),
  };
  if (!album.title) {
    throw new Error("EMPTY_TITLE");
  }
  data.items.unshift(album);
  await writeJson("albums.json", data);
  return album;
}

export async function reorderAlbums(orderedIds) {
  const ids = orderedIds.map((id) => String(id ?? "").trim()).filter(Boolean);
  if (ids.length === 0) {
    throw new Error("EMPTY_ORDER");
  }

  const data = await readJson("albums.json", { items: [] });
  if (ids.length !== data.items.length) {
    throw new Error("ORDER_MISMATCH");
  }

  const byId = new Map(data.items.map((a) => [a.id, a]));
  for (const id of ids) {
    if (!byId.has(id)) {
      throw new Error("ALBUM_NOT_FOUND");
    }
  }

  data.items = ids.map((id, index) => ({
    ...byId.get(id),
    sortOrder: index,
  }));
  await writeJson("albums.json", data);
  return sortAlbumsItems(data.items);
}

export async function deleteAlbum(id) {
  const albumId = String(id ?? "").trim();
  if (!albumId) return false;

  const albumsData = await readJson("albums.json", { items: [] });
  const hadAlbum = albumsData.items.some((a) => a.id === albumId);
  if (!hadAlbum) return false;

  albumsData.items = albumsData.items.filter((a) => a.id !== albumId);
  await writeJson("albums.json", albumsData);

  const photosData = await readJson("photos.json", { items: [] });
  photosData.items = photosData.items.filter((p) => p.albumId !== albumId);
  await writeJson("photos.json", photosData);

  return true;
}

export async function getPhotos() {
  const data = await readJson("photos.json", { items: [] });
  const items = data.items.map((p) => ({
    ...p,
    albumId: p.albumId || DEFAULT_ALBUM_ID,
  }));
  const albums = await getAlbums();
  const byAlbum = new Map();
  for (const photo of items) {
    const list = byAlbum.get(photo.albumId) ?? [];
    list.push(photo);
    byAlbum.set(photo.albumId, list);
  }
  return albums.flatMap((album) => sortPhotosItems(byAlbum.get(album.id) ?? []));
}

export async function addPhoto(item) {
  const albumId = String(item.albumId ?? DEFAULT_ALBUM_ID).trim();
  const album = await getAlbumById(albumId);
  if (!album) {
    throw new Error("INVALID_ALBUM");
  }

  const data = await readJson("photos.json", { items: [] });
  for (const p of data.items) {
    if (p.albumId === albumId) {
      p.sortOrder = (p.sortOrder ?? 0) + 1;
    }
  }
  const photo = {
    ...item,
    albumId,
    id: `p-${Date.now()}`,
    sortOrder: 0,
    createdAt: item.createdAt || new Date().toISOString(),
  };
  if (item.vkId) {
    photo.vkId = item.vkId;
  }
  data.items.unshift(photo);
  await writeJson("photos.json", data);
  return photo;
}

export async function reorderPhotos(albumId, orderedIds) {
  const aid = String(albumId ?? "").trim();
  if (!aid) {
    throw new Error("EMPTY_ALBUM");
  }

  const ids = orderedIds.map((id) => String(id ?? "").trim()).filter(Boolean);
  if (ids.length === 0) {
    throw new Error("EMPTY_ORDER");
  }

  const data = await readJson("photos.json", { items: [] });
  const inAlbum = data.items.filter((p) => (p.albumId || DEFAULT_ALBUM_ID) === aid);
  if (ids.length !== inAlbum.length) {
    throw new Error("ORDER_MISMATCH");
  }

  const byId = new Map(inAlbum.map((p) => [p.id, p]));
  for (const id of ids) {
    if (!byId.has(id)) {
      throw new Error("PHOTO_NOT_FOUND");
    }
  }

  const orderMap = new Map(ids.map((id, index) => [id, index]));
  for (const p of data.items) {
    if ((p.albumId || DEFAULT_ALBUM_ID) === aid && orderMap.has(p.id)) {
      p.sortOrder = orderMap.get(p.id);
    }
  }

  await writeJson("photos.json", data);
  return sortPhotosItems(
    data.items.map((p) => ({
      ...p,
      albumId: p.albumId || DEFAULT_ALBUM_ID,
    }))
  );
}

export async function deletePhoto(id) {
  const photoId = String(id ?? "").trim();
  if (!photoId) return false;

  const data = await readJson("photos.json", { items: [] });
  const had = data.items.some((p) => p.id === photoId);
  if (!had) return false;

  data.items = data.items.filter((p) => p.id !== photoId);
  await writeJson("photos.json", data);
  return true;
}

export async function getStories() {
  const data = await readJson("stories.json", { items: [] });
  return sortStoriesItems(data.items);
}

export async function addStory({ id, title, videoUrl, createdAt, vkId }) {
  const data = await readJson("stories.json", { items: [] });
  const story = {
    id: id || `s-${Date.now()}`,
    title: String(title ?? "").trim() || "Сторис",
    videoUrl: String(videoUrl ?? "").trim(),
    createdAt: createdAt || new Date().toISOString(),
    sortOrder: 0,
  };
  if (vkId) {
    story.vkId = vkId;
  }
  data.items = data.items.map((item) => ({
    ...item,
    sortOrder: (item.sortOrder ?? 0) + 1,
  }));
  data.items.unshift(story);
  await writeJson("stories.json", data);
  return story;
}

export async function reorderStories(orderedIds) {
  const ids = orderedIds.map((id) => String(id ?? "").trim()).filter(Boolean);
  if (ids.length === 0) {
    throw new Error("EMPTY_ORDER");
  }

  const data = await readJson("stories.json", { items: [] });
  if (ids.length !== data.items.length) {
    throw new Error("ORDER_MISMATCH");
  }

  const byId = new Map(data.items.map((item) => [item.id, item]));
  for (const id of ids) {
    if (!byId.has(id)) {
      throw new Error("STORY_NOT_FOUND");
    }
  }

  data.items = ids.map((id, index) => ({
    ...byId.get(id),
    sortOrder: index,
  }));
  await writeJson("stories.json", data);
  return sortStoriesItems(data.items);
}

export async function updateStory(id, { title, videoUrl }) {
  const storyId = String(id ?? "").trim();
  if (!storyId) return null;

  const data = await readJson("stories.json", { items: [] });
  const idx = data.items.findIndex((s) => s.id === storyId);
  if (idx === -1) return null;

  const item = data.items[idx];
  const prevUrl = item.videoUrl;
  const nextUrl = videoUrl != null ? String(videoUrl).trim() : prevUrl;
  const updated = {
    ...item,
    title: title != null ? String(title).trim() || "Сторис" : item.title,
    videoUrl: nextUrl,
  };
  data.items[idx] = updated;
  await writeJson("stories.json", data);

  if (nextUrl !== prevUrl) {
    if (prevUrl?.startsWith("/uploads/stories/")) {
      const absPath = path.join(process.cwd(), "public", prevUrl.replace(/^\//, ""));
      try {
        await fs.unlink(absPath);
      } catch {
        /* file may already be missing */
      }
    }
  }

  return updated;
}

export async function deleteStory(id) {
  const storyId = String(id ?? "").trim();
  if (!storyId) return false;

  const data = await readJson("stories.json", { items: [] });
  const story = data.items.find((s) => s.id === storyId);
  if (!story) return false;

  data.items = data.items.filter((s) => s.id !== storyId);
  await writeJson("stories.json", data);

  if (story.videoUrl?.startsWith("/uploads/stories/")) {
    const absPath = path.join(process.cwd(), "public", story.videoUrl.replace(/^\//, ""));
    try {
      await fs.unlink(absPath);
    } catch {
      /* file may already be missing */
    }
  }

  return true;
}

const VK_IMPORTED_FILE = path.join(DATA_DIR, "vk-imported.json");

async function readVkImported() {
  try {
    const raw = await fs.readFile(VK_IMPORTED_FILE, "utf-8");
    const data = JSON.parse(raw);
    return new Set(Array.isArray(data.ids) ? data.ids : []);
  } catch {
    return new Set();
  }
}

async function writeVkImported(ids) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(VK_IMPORTED_FILE, JSON.stringify({ ids: [...ids] }, null, 2), "utf-8");
}

export async function getVkImportedIds() {
  return readVkImported();
}

export async function isVkImported(vkId) {
  const set = await readVkImported();
  return set.has(vkId);
}

export async function markVkImported(vkIds) {
  const set = await readVkImported();
  for (const id of vkIds) {
    if (id) set.add(id);
  }
  await writeVkImported(set);
}

export async function getPricingContent() {
  const data = await readJson("pricing.json", null);
  if (!data) {
    return createDefaultPricingContent();
  }
  return normalizePricingContent(data);
}

export async function updatePricingContent(content) {
  const normalized = normalizePricingContent(content);
  await writeJson("pricing.json", normalized);
  return normalized;
}
