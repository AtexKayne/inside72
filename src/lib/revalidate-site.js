import { revalidatePath } from "next/cache";
import { getNews } from "@/lib/data-store";

const SITE_PAGE_PATHS = [
  "/",
  "/news",
  "/gallery",
  "/prices",
  "/about",
  "/arenda",
  "/teachers",
  "/privacy",
];

function safeRevalidatePath(path, type) {
  try {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
    return true;
  } catch {
    return false;
  }
}

/** Сбрасывает кэш страниц с ценами и общий layout (JSON-LD на всех страницах). */
export function revalidatePricingCache() {
  const pages = [];
  if (safeRevalidatePath("/prices")) {
    pages.push("/prices");
  }
  return {
    layout: safeRevalidatePath("/", "layout"),
    pages,
  };
}

/** Полный сброс кэша сайта: layout, статические страницы и все новости. */
export async function revalidateSiteCache() {
  const result = {
    layout: safeRevalidatePath("/", "layout"),
    pages: [],
    news: [],
  };

  for (const path of SITE_PAGE_PATHS) {
    if (safeRevalidatePath(path)) {
      result.pages.push(path);
    }
  }

  try {
    const news = await getNews();
    for (const item of news) {
      const path = `/news/${item.id}`;
      if (safeRevalidatePath(path)) {
        result.news.push(path);
      }
    }
  } catch {
    /* ignore */
  }

  return result;
}
