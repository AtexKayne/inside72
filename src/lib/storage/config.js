export function isPostgresStorage() {
  if (process.env.STORAGE_BACKEND === "json") {
    return false;
  }
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}
