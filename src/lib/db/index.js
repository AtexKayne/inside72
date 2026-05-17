import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/storage/database-url";
import * as schema from "./schema";

let client;
let db;
let migrated = false;

function getConnectionString() {
  return getDatabaseUrl();
}

function getSqlClient() {
  if (!client) {
    const url = getConnectionString();
    if (!url) {
      throw new Error("POSTGRES_URL or DATABASE_URL is required");
    }
    const pooled = /:6543\//.test(url) || url.includes("pgbouncer=true");
    client = postgres(url, { prepare: !pooled });
  }
  return client;
}

export function getDb() {
  if (!db) {
    db = drizzle(getSqlClient(), { schema });
  }
  return db;
}

export async function ensureDbSchema() {
  if (migrated) return;
  const sql = getSqlClient();
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
