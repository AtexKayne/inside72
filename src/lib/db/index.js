import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

let db;
let migrated = false;

export function getDb() {
  if (!db) {
    db = drizzle(sql, { schema });
  }
  return db;
}

export async function ensureDbSchema() {
  if (migrated) return;
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
  migrated = true;
}
