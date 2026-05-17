export function isPostgresStorage() {
  if (process.env.STORAGE_BACKEND === "json") {
    return false;
  }
  const hasDbUrl = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  if (process.env.STORAGE_BACKEND === "postgres") {
    return hasDbUrl;
  }
  return process.env.VERCEL === "1" && hasDbUrl;
}
