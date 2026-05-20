import { NextResponse } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth-token";

const ADMIN_PREFIX = "/admin";
const LOGIN = "/admin/login";

function isLocalhost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** Парсит NEXT_PUBLIC_SITE_URL без порта (защита от :3000 в редиректах). */
function getCanonicalSite() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) return null;
  try {
    const u = new URL(siteUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return { protocol: u.protocol, hostname: u.hostname };
  } catch {
    return null;
  }
}

/** Абсолютный публичный URL без порта (Next за nginx иначе подставляет :3000). */
function publicAbsoluteUrl(canonical, pathname, search) {
  return `${canonical.protocol}//${canonical.hostname}${pathname}${search}`;
}

/** 308 на основной домен из NEXT_PUBLIC_SITE_URL (www ↔ без www), запасной вариант если nginx не настроен. */
function canonicalHostRedirect(request) {
  const canonical = getCanonicalSite();
  if (!canonical) return null;

  const requestHost = request.headers.get("host");
  if (!requestHost) return null;

  const requestHostname = requestHost.split(":")[0];
  if (requestHostname === canonical.hostname) return null;
  if (isLocalhost(canonical.hostname) || isLocalhost(requestHostname)) return null;

  const target = publicAbsoluteUrl(
    canonical,
    request.nextUrl.pathname,
    request.nextUrl.search,
  );
  return NextResponse.redirect(target, 308);
}

export async function middleware(request) {
  const hostRedirect = canonicalHostRedirect(request);
  if (hostRedirect) return hostRedirect;

  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_PREFIX) || pathname === LOGIN) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !(await verifyAdminToken(token))) {
    const canonical = getCanonicalSite();
    const search = `?from=${encodeURIComponent(pathname)}`;
    const target = canonical
      ? publicAbsoluteUrl(canonical, LOGIN, search)
      : `${request.nextUrl.origin}${LOGIN}${search}`;
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|txt|xml|webmanifest|html)$).*)",
  ],
};
