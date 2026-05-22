const FALLBACK = "http://localhost:3000";

/** Основной домен продакшена (VPS и fallback на Vercel без NEXT_PUBLIC_SITE_URL). */
export const PRODUCTION_SITE_URL = "https://inside72.ru";

function parseSiteUrl(raw) {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** hostname + protocol для редиректов (без порта). */
export function getCanonicalSite() {
  const parsed =
    parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    (process.env.VERCEL === "1" ? PRODUCTION_SITE_URL : null);
  if (!parsed) return null;

  const u = new URL(parsed);
  return { protocol: u.protocol, hostname: u.hostname };
}

export function getSiteUrl() {
  const fromEnv = parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (fromEnv) return fromEnv;

  if (process.env.VERCEL === "1") {
    return PRODUCTION_SITE_URL;
  }

  return FALLBACK;
}
