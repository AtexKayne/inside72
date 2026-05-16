import { isPostgresStorage } from "@/lib/storage/config";
import * as jsonStore from "@/lib/storage/json-store";
import * as postgresStore from "@/lib/storage/postgres-store";

const store = () => (isPostgresStorage() ? postgresStore : jsonStore);

export const DEFAULT_ALBUM_ID = "alb-default";

export async function getNews() {
  return store().getNews();
}

export async function addNews(item) {
  return store().addNews(item);
}

export async function updateNews(id, fields) {
  return store().updateNews(id, fields);
}

export async function deleteNews(id) {
  return store().deleteNews(id);
}

export async function getAlbums() {
  return store().getAlbums();
}

export async function getAlbumById(id) {
  return store().getAlbumById(id);
}

export async function addAlbum(fields) {
  return store().addAlbum(fields);
}

export async function deleteAlbum(id) {
  return store().deleteAlbum(id);
}

export async function getPhotos() {
  return store().getPhotos();
}

export async function addPhoto(item) {
  return store().addPhoto(item);
}

export async function deletePhoto(id) {
  return store().deletePhoto(id);
}

export async function getStories() {
  return store().getStories();
}

export async function addStory(fields) {
  return store().addStory(fields);
}

export async function deleteStory(id) {
  return store().deleteStory(id);
}
