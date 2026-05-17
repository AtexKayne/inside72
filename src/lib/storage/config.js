import { getDatabaseUrl, isServerlessProduction } from "@/lib/storage/database-url";

export class StorageNotConfiguredError extends Error {
  constructor(message) {
    super(message);
    this.name = "StorageNotConfiguredError";
    this.code = "STORAGE_NOT_CONFIGURED";
  }
}

export function isPostgresStorage() {
  if (process.env.STORAGE_BACKEND === "json" && !isServerlessProduction()) {
    return false;
  }
  return Boolean(getDatabaseUrl());
}

/** На Vercel/production без DATABASE_URL запись в data/*.json невозможна (read-only FS). */
export function assertPostgresStorage() {
  if (isPostgresStorage()) return;
  if (isServerlessProduction()) {
    throw new StorageNotConfiguredError(
      "База не настроена на Vercel. Нужна строка подключения Supabase: " +
        "DATABASE_URL, POSTGRES_URL или POSTGRES_PRISMA_URL_POSTGRES_URL (из интеграции Supabase). " +
        "JSON-хранилище data/ на сервере недоступно."
    );
  }
}
