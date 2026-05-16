import { head, put } from "@vercel/blob";

const META_PATH = "_meta/stories.json";

export function hasBlobStoriesStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readStoriesFromBlob() {
  try {
    const info = await head(META_PATH);
    const res = await fetch(info.url, { cache: "no-store" });
    if (!res.ok) return { items: [] };
    const data = await res.json();
    return Array.isArray(data?.items) ? data : { items: [] };
  } catch {
    return { items: [] };
  }
}

async function writeStoriesToBlob(data) {
  await put(META_PATH, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

export { readStoriesFromBlob, writeStoriesToBlob };
