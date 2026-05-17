import { defineConfig } from "drizzle-kit";
import { getDatabaseUrlUnpooled } from "./src/lib/storage/database-url.js";

export default defineConfig({
  schema: "./src/lib/db/schema.js",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrlUnpooled(),
  },
});
