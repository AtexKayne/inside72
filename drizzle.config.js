import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.js",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL,
  },
});
