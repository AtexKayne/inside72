import { NextResponse } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth-token";

const ADMIN_PREFIX = "/admin";
const LOGIN = "/admin/login";

function isLocalhost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** 308 на основной домен из NEXT_PUBLIC_SITE_URL (www ↔ без www). */
function canonicalHostRedirect(request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) return null;

  try {
    const canonical = new URL(siteUrl);
    const requestHost = request.headers.get("host");
    if (!requestHost) return null;

    const requestHostname = requestHost.split(":")[0];
    const sameHostname = requestHostname === canonical.hostname;
    const samePort = request.nextUrl.port === canonical.port;
    if (sameHostname && samePort) return null;
    if (isLocalhost(canonical.hostname) || isLocalhost(requestHostname)) return null;

    // origin из NEXT_PUBLIC_SITE_URL — без внутреннего порта приложения (например :3000 за nginx)
    const redirect = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      canonical.origin,
    );
    return NextResponse.redirect(redirect, 308);
  } catch {
    return null;
  }
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
    const url = request.nextUrl.clone();
    url.pathname = LOGIN;
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|txt|xml|webmanifest|html)$).*)",
  ],
};
