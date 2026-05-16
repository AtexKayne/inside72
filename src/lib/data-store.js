import fs from "fs/promises";
import path from "path";
import { deleteBlobStoryVideo } from "@/lib/blob-story";
import {
  readStoriesFromBlob,
  hasBlobStoriesStorage,
  writeStoriesToBlob,
} from "@/lib/stories-blob-store";

const DATA_DIR = path.join(process.cwd(), "data");

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

export async function getNews() {
  const data = await readJson("news.json", { items: [] });
  return [...data.items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
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
  data.items.unshift(news);
  await writeJson("news.json", data);
  return news;
}

export async function updateNews(id, { title, excerpt, body }) {
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

export const DEFAULT_ALBUM_ID = "alb-default";

export async function getAlbums() {
  const data = await readJson("albums.json", { items: [] });
  return [...data.items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getAlbumById(id) {
  const albums = await getAlbums();
  return albums.find((a) => a.id === id) ?? null;
}

export async function addAlbum({ title }) {
  const data = await readJson("albums.json", { items: [] });
  const album = {
    id: `alb-${Date.now()}`,
    title: String(title ?? "").trim(),
    createdAt: new Date().toISOString(),
  };
  if (!album.title) {
    throw new Error("EMPTY_TITLE");
  }
  data.items.unshift(album);
  await writeJson("albums.json", data);
  return album;
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
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addPhoto(item) {
  const albumId = String(item.albumId ?? DEFAULT_ALBUM_ID).trim();
  const album = await getAlbumById(albumId);
  if (!album) {
    throw new Error("INVALID_ALBUM");
  }

  const data = await readJson("photos.json", { items: [] });
  const photo = {
    ...item,
    albumId,
    id: `p-${Date.now()}`,
    createdAt: item.createdAt || new Date().toISOString(),
  };
  if (item.vkId) {
    photo.vkId = item.vkId;
  }
  data.items.unshift(photo);
  await writeJson("photos.json", data);
  return photo;
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

async function readStoriesData() {
  if (hasBlobStoriesStorage()) {
    const fromBlob = await readStoriesFromBlob();
    if (fromBlob.items.length > 0) return fromBlob;
    const local = await readJson("stories.json", { items: [] });
    if (local.items.length > 0) {
      await writeStoriesToBlob(local);
      return local;
    }
    return fromBlob;
  }
  return readJson("stories.json", { items: [] });
}

async function writeStoriesData(data) {
  if (hasBlobStoriesStorage()) {
    await writeStoriesToBlob(data);
    return;
  }
  await writeJson("stories.json", data);
}

export async function getStories() {
  const data = await readStoriesData();
  return [...data.items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addStory({ id, title, videoUrl, createdAt, vkId }) {
  const data = await readStoriesData();
  const story = {
    id: id || `s-${Date.now()}`,
    title: String(title ?? "").trim() || "Сторис",
    videoUrl: String(videoUrl ?? "").trim(),
    createdAt: createdAt || new Date().toISOString(),
  };
  if (vkId) {
    story.vkId = vkId;
  }
  data.items.unshift(story);
  await writeStoriesData(data);
  return story;
}

export async function deleteStory(id) {
  const storyId = String(id ?? "").trim();
  if (!storyId) return false;

  const data = await readStoriesData();
  const story = data.items.find((s) => s.id === storyId);
  if (!story) return false;

  data.items = data.items.filter((s) => s.id !== storyId);
  await writeStoriesData(data);

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
