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
  await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS sort_order INTEGER`;
  await sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS sort_order INTEGER`;
  await sql`ALTER TABLE photos ADD COLUMN IF NOT EXISTS sort_order INTEGER`;
  await sql`
    UPDATE stories AS s
    SET sort_order = sub.rn
    FROM (
      SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1)::int AS rn
      FROM stories
      WHERE sort_order IS NULL
    ) AS sub
    WHERE s.id = sub.id AND s.sort_order IS NULL
  `;
  await sql`
    UPDATE albums AS a
    SET sort_order = sub.rn
    FROM (
      SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1)::int AS rn
      FROM albums
      WHERE sort_order IS NULL
    ) AS sub
    WHERE a.id = sub.id AND a.sort_order IS NULL
  `;
  await sql`
    UPDATE photos AS p
    SET sort_order = sub.rn
    FROM (
      SELECT id,
        (ROW_NUMBER() OVER (PARTITION BY album_id ORDER BY created_at DESC) - 1)::int AS rn
      FROM photos
      WHERE sort_order IS NULL
    ) AS sub
    WHERE p.id = sub.id AND p.sort_order IS NULL
  `;
  migrated = true;
}
