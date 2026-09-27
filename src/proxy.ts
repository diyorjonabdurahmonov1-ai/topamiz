import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { SESSION_COOKIE } from "@/lib/auth";
import { GUEST_COOKIE, recordGuestVisit } from "@/lib/guest-visits";

// Next.js 16 renamed middleware.ts to proxy.ts and made it default to the
// Node.js runtime (see node_modules/next/dist/docs/.../proxy.md) — so a
// direct better-sqlite3 call here, unlike the old Edge-only middleware, is
// fine. Assigns a long-lived anonymous id to anyone without a session
// cookie, so the admin panel can show how many distinct guests have used
// the site without ever registering.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const existing = request.cookies.get(GUEST_COOKIE)?.value;
  const guestId = existing ?? crypto.randomUUID();
  recordGuestVisit(guestId);

  if (existing) return NextResponse.next();

  const response = NextResponse.next();
  response.cookies.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|icon-|apple-touch-icon|opengraph-image|twitter-image).*)",
  ],
};
