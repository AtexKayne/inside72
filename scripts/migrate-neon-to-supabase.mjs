#!/usr/bin/env node
/**
 * Одноразовый перенос данных Neon → Supabase.
 * SOURCE_DATABASE_URL — старая Neon
 * TARGET_DATABASE_URL — новая Supabase (без pooler, порт 5432)
 */
import postgres from "postgres";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl =
  process.env.TARGET_DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!sourceUrl || !targetUrl) {
  console.error("Задайте SOURCE_DATABASE_URL и TARGET_DATABASE_URL (или DATABASE_URL_UNPOOLED)");
  process.exit(1);
}

const TABLES = ["news", "albums", "photos", "stories", "vk_imported"];

const source = postgres(sourceUrl, { prepare: false });
const target = postgres(targetUrl, { prepare: false });

async function ensureTargetSchema() {
  await target`
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
  await target`
    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;
  await target`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      album_id TEXT NOT NULL,
      src TEXT NOT NULL,
      caption TEXT NOT NULL,
      vk_id TEXT,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;
  await target`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      video_url TEXT NOT NULL,
      vk_id TEXT,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;
  await target`
    CREATE TABLE IF NOT EXISTS vk_imported (
      vk_id TEXT PRIMARY KEY
    )
  `;
  await target`ALTER TABLE news ADD COLUMN IF NOT EXISTS images TEXT`;
}

async function copyTable(name) {
  const rows = await source.unsafe(`SELECT * FROM ${name}`);
  if (rows.length === 0) {
    console.log(`  ${name}: 0 строк`);
    return;
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  for (const row of rows) {
    const values = columns.map((c) => row[c]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    await target.unsafe(
      `INSERT INTO ${name} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
      values
    );
  }

  console.log(`  ${name}: ${rows.length} строк`);
}

async function main() {
  console.log("Создание схемы в Supabase…");
  await ensureTargetSchema();

  console.log("Копирование данных…");
  for (const table of TABLES) {
    await copyTable(table);
  }

  console.log("Готово.");
  await source.end();
  await target.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
