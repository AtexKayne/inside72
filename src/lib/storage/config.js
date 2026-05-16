export function isPostgresStorage() {
  if (process.env.STORAGE_BACKEND === "json") {
    return false;
  }
  if (process.env.STORAGE_BACKEND === "postgres") {
    return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  }
  const hasDbUrl = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  return process.env.VERCEL === "1" && hasDbUrl;
}
