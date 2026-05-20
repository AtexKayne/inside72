/**
 * Проверяет URL видео для сторис: локальный файл на сайте или внешняя ссылка (VK и т.п.).
 * @param {string} url
 */
export function isAllowedStoryVideoUrl(url) {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("/uploads/stories/")) {
    return !trimmed.includes("..");
  }

  try {
    const u = new URL(trimmed);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
