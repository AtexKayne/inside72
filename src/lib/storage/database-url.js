const URL_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "SUPABASE_DATABASE_URL",
];

/** Строка подключения к Postgres (Supabase и др.). */
export function getDatabaseUrl() {
  for (const key of URL_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Прямое подключение (миграции, drizzle-kit). */
export function getDatabaseUrlUnpooled() {
  const direct =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim();
  if (direct) return direct;
  return getDatabaseUrl();
}

export function isServerlessProduction() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}
