import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const news = pgTable("news", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  images: text("images"),
  vkId: text("vk_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }),
});

export const albums = pgTable("albums", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const photos = pgTable("photos", {
  id: text("id").primaryKey(),
  albumId: text("album_id").notNull(),
  src: text("src").notNull(),
  caption: text("caption").notNull(),
  vkId: text("vk_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const stories = pgTable("stories", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  videoUrl: text("video_url").notNull(),
  vkId: text("vk_id"),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const vkImported = pgTable("vk_imported", {
  vkId: text("vk_id").primaryKey(),
});
