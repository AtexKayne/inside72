import { getDatabaseUrl } from "@/lib/storage/database-url";

export class StorageNotConfiguredError extends Error {
  constructor(message) {
    super(message);
    this.name = "StorageNotConfiguredError";
    this.code = "STORAGE_NOT_CONFIGURED";
  }
}

/** Vercel: read-only FS — JSON в data/ недоступен. */
export function isVercelRuntime() {
  return process.env.VERCEL === "1";
}

/**
 * Postgres, если задан DATABASE_URL (и не форсирован JSON).
 * STORAGE_BACKEND=json — файлы data/*.json (VPS / локально; на Vercel нельзя).
 */
export function isPostgresStorage() {
  const backend = process.env.STORAGE_BACKEND?.trim().toLowerCase();
  if (backend === "json") {
    return false;
  }
  if (backend === "postgres") {
    return Boolean(getDatabaseUrl());
  }
  return Boolean(getDatabaseUrl());
}

/** На Vercel без Postgres запись в data/*.json невозможна (read-only FS). */
export function assertPostgresStorage() {
  if (isPostgresStorage()) return;
  if (isVercelRuntime()) {
    throw new StorageNotConfiguredError(
      "На Vercel нужен Postgres (DATABASE_URL). " +
        "JSON-хранилище data/ там недоступно (read-only FS). " +
        "Для JSON используйте VPS и STORAGE_BACKEND=json."
    );
  }
}
