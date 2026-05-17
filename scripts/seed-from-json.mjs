#!/usr/bin/env node
/**
 * Загружает данные из data/*.json в Postgres.
 * Использование: POSTGRES_URL=... node scripts/seed-from-json.mjs
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");

const dbUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Укажите POSTGRES_URL или DATABASE_URL");
  process.exit(1);
}

process.env.POSTGRES_URL = dbUrl;

const { sql } = await import("@vercel/postgres");
const { drizzle } = await import("drizzle-orm/vercel-postgres");
const schema = await import("../src/lib/db/schema.js");

const db = drizzle(sql, { schema: schema });

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(path.join(dataDir, file), "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      body TEXT NOT NULL,
      vk_id TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      album_id TEXT NOT NULL,
      src TEXT NOT NULL,
      caption TEXT NOT NULL,
      vk_id TEXT,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      video_url TEXT NOT NULL,
      vk_id TEXT,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS vk_imported (
      vk_id TEXT PRIMARY KEY
    )
  `;
  await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS images TEXT`;
}

function newsImagesJson(item) {
  if (!Array.isArray(item.images) || !item.images.length) return null;
  return JSON.stringify(item.images.filter((u) => typeof u === "string" && u.trim()));
}

async function upsertNews(items) {
  for (const item of items) {
    const images = newsImagesJson(item);
    await db
      .insert(schema.news)
      .values({
        id: item.id,
        title: item.title,
        excerpt: item.excerpt,
        body: item.body,
        images,
        vkId: item.vkId || null,
        createdAt: new Date(item.createdAt),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      })
      .onConflictDoUpdate({
        target: schema.news.id,
        set: {
          title: item.title,
          excerpt: item.excerpt,
          body: item.body,
          images,
          vkId: item.vkId || null,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
        },
      });
  }
}

async function upsertAlbums(items) {
  for (const item of items) {
    await db
      .insert(schema.albums)
      .values({
        id: item.id,
        title: item.title,
        createdAt: new Date(item.createdAt),
      })
      .onConflictDoUpdate({
        target: schema.albums.id,
        set: { title: item.title },
      });
  }
}

async function upsertPhotos(items) {
  for (const item of items) {
    await db
      .insert(schema.photos)
      .values({
        id: item.id,
        albumId: item.albumId || "alb-default",
        src: item.src,
        caption: item.caption,
        vkId: item.vkId || null,
        createdAt: new Date(item.createdAt),
      })
      .onConflictDoUpdate({
        target: schema.photos.id,
        set: {
          albumId: item.albumId || "alb-default",
          src: item.src,
          caption: item.caption,
          vkId: item.vkId || null,
        },
      });
  }
}

async function upsertStories(items) {
  for (const item of items) {
    await db
      .insert(schema.stories)
      .values({
        id: item.id,
        title: item.title,
        videoUrl: item.videoUrl,
        vkId: item.vkId || null,
        createdAt: new Date(item.createdAt),
      })
      .onConflictDoUpdate({
        target: schema.stories.id,
        set: {
          title: item.title,
          videoUrl: item.videoUrl,
          vkId: item.vkId || null,
        },
      });
  }
}

async function upsertVkImported(ids) {
  for (const vkId of ids) {
    await db.insert(schema.vkImported).values({ vkId }).onConflictDoNothing();
  }
}

async function main() {
  await ensureSchema();

  const news = await readJson("news.json", { items: [] });
  const albums = await readJson("albums.json", { items: [] });
  const photos = await readJson("photos.json", { items: [] });
  const stories = await readJson("stories.json", { items: [] });
  const vk = await readJson("vk-imported.json", { ids: [] });

  await upsertNews(news.items);
  await upsertAlbums(albums.items);
  await upsertPhotos(photos.items);
  await upsertStories(stories.items);
  await upsertVkImported(vk.ids);

  console.log(
    `Готово: news=${news.items.length}, albums=${albums.items.length}, photos=${photos.items.length}, stories=${stories.items.length}, vk=${vk.ids.length}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
