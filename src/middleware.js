import { NextResponse } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth-token";
import { getCanonicalSite } from "@/lib/site";

const ADMIN_PREFIX = "/admin";
const LOGIN = "/admin/login";

function isLocalhost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isVercelHost(hostname) {
  return hostname === "vercel.app" || hostname.endsWith(".vercel.app");
}

/** Абсолютный публичный URL без порта. */
function publicAbsoluteUrl(canonical, pathname, search) {
  return `${canonical.protocol}//${canonical.hostname}${pathname}${search}`;
}

/** 308 на основной домен (www ↔ без www, *.vercel.app → inside72.ru). */
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

/** На Vercel: preview/production *.vercel.app → основной домен. */
function vercelHostRedirect(request) {
  if (process.env.VERCEL !== "1") return null;

  const requestHostname = request.headers.get("host")?.split(":")[0];
  if (!requestHostname || !isVercelHost(requestHostname)) return null;

  const canonical = getCanonicalSite();
  if (!canonical) return null;

  const target = publicAbsoluteUrl(
    canonical,
    request.nextUrl.pathname,
    request.nextUrl.search,
  );
  return NextResponse.redirect(target, 308);
}

export async function middleware(request) {
  const vercelRedirect = vercelHostRedirect(request);
  if (vercelRedirect) return vercelRedirect;

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
