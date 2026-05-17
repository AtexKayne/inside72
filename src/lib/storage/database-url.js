/** Pooled URL (приложение, :6543 / pgbouncer). */
const POOLED_URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "SUPABASE_DATABASE_URL",
  // Vercel ↔ Supabase integration (префикс POSTGRES_PRISMA_URL_)
  "POSTGRES_PRISMA_URL_POSTGRES_URL",
  "POSTGRES_PRISMA_URL_POSTGRES_PRISMA_URL",
];

/** Прямое подключение (миграции, drizzle-kit, :5432). */
const UNPOOLED_URL_KEYS = [
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_PRISMA_URL_POSTGRES_URL_NON_POOLING",
];

function readEnvUrl(keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value?.startsWith("postgres")) return value;
  }
  return undefined;
}

function buildUrlFromParts({ port = 5432, pgbouncer = false } = {}) {
  const password = process.env.POSTGRES_PRISMA_URL_POSTGRES_PASSWORD?.trim();
  const host =
    process.env.POSTGRES_PRISMA_URL_POSTGRES_HOST?.trim() ||
    process.env.POSTGRES_HOST?.trim();
  const user = process.env.POSTGRES_PRISMA_URL_POSTGRES_USER?.trim() || "postgres";
  const database =
    process.env.POSTGRES_PRISMA_URL_POSTGRES_DATABASE?.trim() ||
    process.env.POSTGRES_DATABASE?.trim() ||
    "postgres";
  if (!password || !host) return undefined;
  const params = new URLSearchParams({ sslmode: "require" });
  if (pgbouncer) params.set("pgbouncer", "true");
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?${params}`;
}

/** Строка подключения к Postgres (Supabase и др.). */
export function getDatabaseUrl() {
  return (
    readEnvUrl(POOLED_URL_KEYS) ||
    buildUrlFromParts({ port: 6543, pgbouncer: true }) ||
    buildUrlFromParts({ port: 5432 })
  );
}

/** Прямое подключение (миграции, drizzle-kit). */
export function getDatabaseUrlUnpooled() {
  return (
    readEnvUrl(UNPOOLED_URL_KEYS) ||
    buildUrlFromParts({ port: 5432 }) ||
    getDatabaseUrl()
  );
}

export function isServerlessProduction() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}
