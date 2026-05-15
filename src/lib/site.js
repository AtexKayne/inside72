const FALLBACK = "http://localhost:3000";

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      console.warn("[site] NEXT_PUBLIC_SITE_URL must be http or https; using http://localhost:3000.");
      return FALLBACK;
    }
    return u.href.replace(/\/$/, "");
  } catch {
    console.warn("[site] Invalid NEXT_PUBLIC_SITE_URL; using http://localhost:3000.");
    return FALLBACK;
  }
}
