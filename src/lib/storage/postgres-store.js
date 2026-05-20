import fs from "fs/promises";
import path from "path";
import { asc, desc, eq } from "drizzle-orm";
import { ensureDbSchema, getDb } from "@/lib/db";
import * as tables from "@/lib/db/schema";
import { sortAlbumsItems, sortPhotosItems } from "@/lib/gallery-order";
import { sortStoriesItems } from "@/lib/story-order";

export const DEFAULT_ALBUM_ID = "alb-default";

async function db() {
  await ensureDbSchema();
  return getDb();
}

function toIso(date) {
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
}

function parseNewsImages(raw) {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    const urls = parsed.filter((u) => typeof u === "string" && u.trim());
    return urls.length ? urls : undefined;
  } catch {
    return undefined;
  }
}

function mapNews(row) {
  const images = parseNewsImages(row.images);
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    createdAt: toIso(row.createdAt),
    ...(images ? { images } : {}),
    ...(row.vkId ? { vkId: row.vkId } : {}),
    ...(row.updatedAt ? { updatedAt: toIso(row.updatedAt) } : {}),
  };
}

function mapAlbum(row) {
  return {
    id: row.id,
    title: row.title,
    createdAt: toIso(row.createdAt),
    ...(row.sortOrder != null ? { sortOrder: row.sortOrder } : {}),
  };
}

function mapPhoto(row) {
  return {
    id: row.id,
    albumId: row.albumId || DEFAULT_ALBUM_ID,
    src: row.src,
    caption: row.caption,
    createdAt: toIso(row.createdAt),
    ...(row.sortOrder != null ? { sortOrder: row.sortOrder } : {}),
    ...(row.vkId ? { vkId: row.vkId } : {}),
  };
}

function mapStory(row) {
  return {
    id: row.id,
    title: row.title,
    videoUrl: row.videoUrl,
    createdAt: toIso(row.createdAt),
    ...(row.sortOrder != null ? { sortOrder: row.sortOrder } : {}),
    ...(row.vkId ? { vkId: row.vkId } : {}),
  };
}

export async function getNews() {
  const rows = await (await db()).select().from(tables.news).orderBy(desc(tables.news.createdAt));
  return rows.map(mapNews);
}

export async function addNews(item) {
  const images =
    Array.isArray(item.images) && item.images.length
      ? JSON.stringify(item.images.filter((u) => typeof u === "string" && u.trim()))
      : null;
  const news = {
    id: `n-${Date.now()}`,
    title: item.title,
    excerpt: item.excerpt,
    body: item.body,
    images,
    vkId: item.vkId || null,
    createdAt: new Date(item.createdAt || Date.now()),
    updatedAt: null,
  };
  await (await db()).insert(tables.news).values(news);
  return mapNews(news);
}

export async function updateNews(id, { title, excerpt, body, images }) {
  const newsId = String(id ?? "").trim();
  if (!newsId) return null;

  const database = await db();
  const [existing] = await database.select().from(tables.news).where(eq(tables.news.id, newsId));
  if (!existing) return null;

  const updated = {
    title: String(title ?? existing.title).trim(),
    excerpt: String(excerpt ?? existing.excerpt).trim(),
    body: String(body ?? existing.body).trim(),
    updatedAt: new Date(),
  };
  if (images !== undefined) {
    const urls = Array.isArray(images)
      ? images.filter((u) => typeof u === "string" && u.trim()).map((u) => u.trim())
      : [];
    updated.images = urls.length ? JSON.stringify(urls) : null;
  }
  await database.update(tables.news).set(updated).where(eq(tables.news.id, newsId));

  return mapNews({ ...existing, ...updated });
}

export async function deleteNews(id) {
  const newsId = String(id ?? "").trim();
  if (!newsId) return false;

  const database = await db();
  const [existing] = await database.select().from(tables.news).where(eq(tables.news.id, newsId));
  if (!existing) return false;

  await database.delete(tables.news).where(eq(tables.news.id, newsId));
  return true;
}

export async function getAlbums() {
  const rows = await (await db())
    .select()
    .from(tables.albums)
    .orderBy(asc(tables.albums.sortOrder), desc(tables.albums.createdAt));
  return sortAlbumsItems(rows.map(mapAlbum));
}

export async function getAlbumById(id) {
  const [row] = await (await db()).select().from(tables.albums).where(eq(tables.albums.id, id));
  return row ? mapAlbum(row) : null;
}

export async function addAlbum({ title }) {
  const database = await db();
  const existing = await database
    .select({ id: tables.albums.id, sortOrder: tables.albums.sortOrder })
    .from(tables.albums);

  for (const row of existing) {
    await database
      .update(tables.albums)
      .set({ sortOrder: (row.sortOrder ?? 0) + 1 })
      .where(eq(tables.albums.id, row.id));
  }

  const album = {
    id: `alb-${Date.now()}`,
    title: String(title ?? "").trim(),
    sortOrder: 0,
    createdAt: new Date(),
  };
  if (!album.title) {
    throw new Error("EMPTY_TITLE");
  }
  await database.insert(tables.albums).values(album);
  return mapAlbum(album);
}

export async function reorderAlbums(orderedIds) {
  const ids = orderedIds.map((id) => String(id ?? "").trim()).filter(Boolean);
  if (ids.length === 0) {
    throw new Error("EMPTY_ORDER");
  }

  const database = await db();
  const rows = await database.select({ id: tables.albums.id }).from(tables.albums);
  if (ids.length !== rows.length) {
    throw new Error("ORDER_MISMATCH");
  }

  const known = new Set(rows.map((r) => r.id));
  for (const id of ids) {
    if (!known.has(id)) {
      throw new Error("ALBUM_NOT_FOUND");
    }
  }

  for (let index = 0; index < ids.length; index += 1) {
    await database
      .update(tables.albums)
      .set({ sortOrder: index })
      .where(eq(tables.albums.id, ids[index]));
  }

  return getAlbums();
}

export async function deleteAlbum(id) {
  const albumId = String(id ?? "").trim();
  if (!albumId) return false;

  const database = await db();
  const [existing] = await database.select().from(tables.albums).where(eq(tables.albums.id, albumId));
  if (!existing) return false;

  await database.delete(tables.albums).where(eq(tables.albums.id, albumId));
  await database.delete(tables.photos).where(eq(tables.photos.albumId, albumId));
  return true;
}

export async function getPhotos() {
  const albums = await getAlbums();
  const rows = await (await db()).select().from(tables.photos);
  const mapped = rows.map(mapPhoto);
  const byAlbum = new Map();
  for (const photo of mapped) {
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

  const database = await db();
  const inAlbum = await database
    .select({ id: tables.photos.id, sortOrder: tables.photos.sortOrder })
    .from(tables.photos)
    .where(eq(tables.photos.albumId, albumId));

  for (const row of inAlbum) {
    await database
      .update(tables.photos)
      .set({ sortOrder: (row.sortOrder ?? 0) + 1 })
      .where(eq(tables.photos.id, row.id));
  }

  const photo = {
    id: `p-${Date.now()}`,
    albumId,
    src: item.src,
    caption: item.caption ?? "",
    vkId: item.vkId || null,
    sortOrder: 0,
    createdAt: new Date(item.createdAt || Date.now()),
  };
  await database.insert(tables.photos).values(photo);
  return mapPhoto(photo);
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

  const database = await db();
  const rows = await database
    .select({ id: tables.photos.id })
    .from(tables.photos)
    .where(eq(tables.photos.albumId, aid));

  if (ids.length !== rows.length) {
    throw new Error("ORDER_MISMATCH");
  }

  const known = new Set(rows.map((r) => r.id));
  for (const id of ids) {
    if (!known.has(id)) {
      throw new Error("PHOTO_NOT_FOUND");
    }
  }

  for (let index = 0; index < ids.length; index += 1) {
    await database
      .update(tables.photos)
      .set({ sortOrder: index })
      .where(eq(tables.photos.id, ids[index]));
  }

  return getPhotos();
}

export async function deletePhoto(id) {
  const photoId = String(id ?? "").trim();
  if (!photoId) return false;

  const database = await db();
  const [existing] = await database.select().from(tables.photos).where(eq(tables.photos.id, photoId));
  if (!existing) return false;

  await database.delete(tables.photos).where(eq(tables.photos.id, photoId));
  return true;
}

export async function getStories() {
  const rows = await (await db())
    .select()
    .from(tables.stories)
    .orderBy(asc(tables.stories.sortOrder), desc(tables.stories.createdAt));
  return sortStoriesItems(rows.map(mapStory));
}

export async function addStory({ id, title, videoUrl, createdAt, vkId }) {
  const database = await db();
  const existing = await database
    .select({ id: tables.stories.id, sortOrder: tables.stories.sortOrder })
    .from(tables.stories);

  for (const row of existing) {
    await database
      .update(tables.stories)
      .set({ sortOrder: (row.sortOrder ?? 0) + 1 })
      .where(eq(tables.stories.id, row.id));
  }

  const story = {
    id: id || `s-${Date.now()}`,
    title: String(title ?? "").trim() || "Сторис",
    videoUrl: String(videoUrl ?? "").trim(),
    vkId: vkId || null,
    sortOrder: 0,
    createdAt: new Date(createdAt || Date.now()),
  };
  await database.insert(tables.stories).values(story);
  return mapStory(story);
}

export async function reorderStories(orderedIds) {
  const ids = orderedIds.map((id) => String(id ?? "").trim()).filter(Boolean);
  if (ids.length === 0) {
    throw new Error("EMPTY_ORDER");
  }

  const database = await db();
  const rows = await database.select({ id: tables.stories.id }).from(tables.stories);
  if (ids.length !== rows.length) {
    throw new Error("ORDER_MISMATCH");
  }

  const known = new Set(rows.map((r) => r.id));
  for (const id of ids) {
    if (!known.has(id)) {
      throw new Error("STORY_NOT_FOUND");
    }
  }

  for (let index = 0; index < ids.length; index += 1) {
    await database
      .update(tables.stories)
      .set({ sortOrder: index })
      .where(eq(tables.stories.id, ids[index]));
  }

  return getStories();
}

export async function updateStory(id, { title, videoUrl }) {
  const storyId = String(id ?? "").trim();
  if (!storyId) return null;

  const database = await db();
  const [existing] = await database
    .select()
    .from(tables.stories)
    .where(eq(tables.stories.id, storyId));
  if (!existing) return null;

  const prevUrl = existing.videoUrl;
  const nextUrl = videoUrl != null ? String(videoUrl).trim() : prevUrl;
  const patch = {
    title: title != null ? String(title).trim() || "Сторис" : existing.title,
    videoUrl: nextUrl,
  };

  await database.update(tables.stories).set(patch).where(eq(tables.stories.id, storyId));

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

  return mapStory({ ...existing, ...patch });
}

export async function deleteStory(id) {
  const storyId = String(id ?? "").trim();
  if (!storyId) return false;

  const database = await db();
  const [story] = await database.select().from(tables.stories).where(eq(tables.stories.id, storyId));
  if (!story) return false;

  await database.delete(tables.stories).where(eq(tables.stories.id, storyId));

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

export async function getVkImportedIds() {
  const rows = await (await db()).select().from(tables.vkImported);
  return new Set(rows.map((r) => r.vkId));
}

export async function isVkImported(vkId) {
  const [row] = await (await db())
    .select()
    .from(tables.vkImported)
    .where(eq(tables.vkImported.vkId, vkId));
  return Boolean(row);
}

export async function markVkImported(vkIds) {
  const ids = vkIds.filter(Boolean);
  if (ids.length === 0) return;

  const database = await db();
  await database
    .insert(tables.vkImported)
    .values(ids.map((vkId) => ({ vkId })))
    .onConflictDoNothing();
}
