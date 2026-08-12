import dns from "dns";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl, getDatabaseUrlUnpooled } from "@/lib/storage/database-url";
import * as schema from "./schema";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* Node < 17 */
}

const globalForDb = globalThis;

let client = globalForDb.__insidePgClient;
let db = globalForDb.__insideDrizzle;
let migrated = Boolean(globalForDb.__insidePgMigrated);
/** @type {Promise<void> | null} */
let migratePromise = globalForDb.__insidePgMigratePromise ?? null;

function isTransactionPooler(url) {
  return /:6543(?:\/|\?|$)/.test(url) || /(?:\?|&)pgbouncer=true(?:&|$)/i.test(url);
}

/**
 * Запросы — через transaction pooler (:6543): больше слотов, не держит session.
 * Session (:5432) только для редкого DDL в resolveMigrateDatabaseUrl().
 * Долгий app-клиент на :5432 легко забивает pool_size (~15) и вешает всё.
 */
function resolveAppDatabaseUrl() {
  const pooled = getDatabaseUrl();
  const unpooled = getDatabaseUrlUnpooled();
  if (pooled && isTransactionPooler(pooled)) return pooled;
  return pooled || unpooled;
}

function resolveMigrateDatabaseUrl() {
  const pooled = getDatabaseUrl();
  const unpooled = getDatabaseUrlUnpooled();
  if (unpooled && !isTransactionPooler(unpooled)) return unpooled;
  if (pooled && !isTransactionPooler(pooled)) return pooled;
  return null;
}

function createSqlClient(url, { max } = {}) {
  return postgres(url, {
    // Без prepared statements и без pg_catalog type fetch — быстрее и безопаснее с PgBouncer.
    prepare: false,
    fetch_types: false,
    max: max ?? 1,
    connect_timeout: 12,
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    ssl: "require",
    onnotice: () => {},
    connection: {
      application_name: "inside-site",
    },
  });
}

function getSqlClient() {
  if (!client) {
    const url = resolveAppDatabaseUrl();
    if (!url) {
      throw new Error("POSTGRES_URL or DATABASE_URL is required");
    }
    try {
      const parsed = new URL(url);
      console.info(
        `[db] connect ${parsed.hostname}:${parsed.port || "5432"}` +
          `${isTransactionPooler(url) ? " (transaction pooler)" : " (session)"}`
      );
    } catch {
      console.info("[db] connect (url parse failed)");
    }
    client = createSqlClient(url);
    globalForDb.__insidePgClient = client;
  }
  return client;
}

export function getDb() {
  if (!db) {
    db = drizzle(getSqlClient(), { schema });
    globalForDb.__insideDrizzle = db;
  }
  return db;
}

async function runMigrations(sql) {
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
  await sql`
    CREATE TABLE IF NOT EXISTS site_content (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `;
  await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS images TEXT`;
  await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS sort_order INTEGER`;
  await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS slides TEXT`;
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
}

async function schemaLooksReady(sql) {
  try {
    await sql`select 1 from albums limit 1`;
    return true;
  } catch (err) {
    const code = err?.code || err?.cause?.code;
    if (code === "42P01") return false;
    throw err;
  }
}

export async function ensureDbSchema() {
  if (migrated) return;
  if (!migratePromise) {
    migratePromise = (async () => {
      const appUrl = resolveAppDatabaseUrl();
      if (!appUrl) {
        throw new Error("POSTGRES_URL or DATABASE_URL is required");
      }

      const sql = getSqlClient();
      if (await schemaLooksReady(sql)) {
        migrated = true;
        globalForDb.__insidePgMigrated = true;
        return;
      }

      const migrateUrl = resolveMigrateDatabaseUrl();
      if (!migrateUrl) {
        throw new Error(
          "Таблицы не найдены, а миграция через transaction pooler (:6543) невозможна. " +
            "Задайте DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING (порт 5432)."
        );
      }

      const migrateClient = createSqlClient(migrateUrl, { max: 1 });
      try {
        await runMigrations(migrateClient);
        migrated = true;
        globalForDb.__insidePgMigrated = true;
      } finally {
        await migrateClient.end({ timeout: 5 }).catch(() => {});
      }
    })()
      .catch((err) => {
        migratePromise = null;
        globalForDb.__insidePgMigratePromise = null;
        throw err;
      })
      .then((value) => {
        globalForDb.__insidePgMigratePromise = migratePromise;
        return value;
      });

    globalForDb.__insidePgMigratePromise = migratePromise;
  }

  await migratePromise;
}
