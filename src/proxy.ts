import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { SESSION_COOKIE } from "@/lib/auth";
import { GUEST_COOKIE, recordGuestVisit } from "@/lib/guest-visits";
import { getClientIp } from "@/lib/rate-limit";
import { countryForIp } from "@/lib/geo";
import { LOCALE_COOKIE, localeForCountry } from "@/lib/i18n/locales";

// Next.js 16 renamed middleware.ts to proxy.ts and made it default to the
// Node.js runtime (see node_modules/next/dist/docs/.../proxy.md) — so a
// direct better-sqlite3 call here, unlike the old Edge-only middleware, is
// fine.
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Assigns a long-lived anonymous id to anyone without a session cookie, so
  // the admin panel can show how many distinct guests have used the site
  // without ever registering.
  if (!request.cookies.has(SESSION_COOKIE)) {
    const existingGuestId = request.cookies.get(GUEST_COOKIE)?.value;
    const guestId = existingGuestId ?? crypto.randomUUID();
    recordGuestVisit(guestId);
    if (!existingGuestId) {
      response.cookies.set(GUEST_COOKIE, guestId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
  }

  // A first-time visitor (any visitor, logged in or not) with no language
  // cookie yet gets one guessed from their IP's country, so the site opens
  // in their language instead of always defaulting to Uzbek. A manual pick
  // via the language switcher always overwrites this cookie afterward.
  if (!request.cookies.has(LOCALE_COOKIE)) {
    const country = countryForIp(getClientIp(request));
    response.cookies.set(LOCALE_COOKIE, localeForCountry(country), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|icon-|apple-touch-icon|opengraph-image|twitter-image|.well-known|sw.js|notification-badge).*)",
  ],
};
