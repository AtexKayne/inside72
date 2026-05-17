import fs from "fs/promises";
import path from "path";
import { desc, eq } from "drizzle-orm";
import { deleteBlobStoryVideo } from "@/lib/blob-story";
import { ensureDbSchema, getDb } from "@/lib/db";
import * as tables from "@/lib/db/schema";

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
  };
}

function mapPhoto(row) {
  return {
    id: row.id,
    albumId: row.albumId || DEFAULT_ALBUM_ID,
    src: row.src,
    caption: row.caption,
    createdAt: toIso(row.createdAt),
    ...(row.vkId ? { vkId: row.vkId } : {}),
  };
}

function mapStory(row) {
  return {
    id: row.id,
    title: row.title,
    videoUrl: row.videoUrl,
    createdAt: toIso(row.createdAt),
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

export async function updateNews(id, { title, excerpt, body }) {
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
  const rows = await (await db()).select().from(tables.albums).orderBy(desc(tables.albums.createdAt));
  return rows.map(mapAlbum);
}

export async function getAlbumById(id) {
  const [row] = await (await db()).select().from(tables.albums).where(eq(tables.albums.id, id));
  return row ? mapAlbum(row) : null;
}

export async function addAlbum({ title }) {
  const album = {
    id: `alb-${Date.now()}`,
    title: String(title ?? "").trim(),
    createdAt: new Date(),
  };
  if (!album.title) {
    throw new Error("EMPTY_TITLE");
  }
  await (await db()).insert(tables.albums).values(album);
  return mapAlbum(album);
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
  const rows = await (await db()).select().from(tables.photos).orderBy(desc(tables.photos.createdAt));
  return rows.map(mapPhoto);
}

export async function addPhoto(item) {
  const albumId = String(item.albumId ?? DEFAULT_ALBUM_ID).trim();
  const album = await getAlbumById(albumId);
  if (!album) {
    throw new Error("INVALID_ALBUM");
  }

  const photo = {
    id: `p-${Date.now()}`,
    albumId,
    src: item.src,
    caption: item.caption,
    vkId: item.vkId || null,
    createdAt: new Date(item.createdAt || Date.now()),
  };
  await (await db()).insert(tables.photos).values(photo);
  return mapPhoto(photo);
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
  const rows = await (await db()).select().from(tables.stories).orderBy(desc(tables.stories.createdAt));
  return rows.map(mapStory);
}

export async function addStory({ id, title, videoUrl, createdAt, vkId }) {
  const story = {
    id: id || `s-${Date.now()}`,
    title: String(title ?? "").trim() || "Сторис",
    videoUrl: String(videoUrl ?? "").trim(),
    vkId: vkId || null,
    createdAt: new Date(createdAt || Date.now()),
  };
  await (await db()).insert(tables.stories).values(story);
  return mapStory(story);
}

export async function deleteStory(id) {
  const storyId = String(id ?? "").trim();
  if (!storyId) return false;

  const database = await db();
  const [story] = await database.select().from(tables.stories).where(eq(tables.stories.id, storyId));
  if (!story) return false;

  await database.delete(tables.stories).where(eq(tables.stories.id, storyId));

  await deleteBlobStoryVideo(story.videoUrl);

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
