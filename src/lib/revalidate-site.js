import { revalidatePath } from "next/cache";

const SITE_PAGE_PATHS = ["/", "/privacy"];

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
  return {
    layout: safeRevalidatePath("/", "layout"),
    pages: safeRevalidatePath("/") ? ["/"] : [],
  };
}

/** Полный сброс кэша публичных страниц. */
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

  return result;
}
