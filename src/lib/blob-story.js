/**
 * URL видео в Vercel Blob (публичное хранилище).
 * @param {string} url
 */
export function isVercelBlobUrl(url) {
  try {
    const { hostname } = new URL(String(url ?? "").trim());
    return (
      hostname.endsWith(".public.blob.vercel-storage.com") ||
      hostname === "public.blob.vercel-storage.com" ||
      hostname.endsWith(".blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

/**
 * Удаляет файл из Blob по URL (игнорирует ошибки).
 * @param {string} url
 */
export async function deleteBlobStoryVideo(url) {
  if (!isVercelBlobUrl(url)) return;
  const { del } = await import("@vercel/blob");
  try {
    await del(url);
  } catch {
    /* файл мог быть уже удалён */
  }
}
