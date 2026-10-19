import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildGoogleAuthUrl, generateOAuthState, OAUTH_STATE_COOKIE } from "@/lib/google-auth";
import { getBaseUrl } from "@/lib/qr";
import { OAUTH_NEXT_COOKIE } from "@/lib/google-auth";
import { safeNextPath } from "@/lib/safe-next";

export async function GET(request: Request) {
  const state = generateOAuthState();
  const redirectUri = `${getBaseUrl(request)}/api/auth/google/callback`;

  const store = await cookies();
  store.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  // Where to land afterwards (the listing that asked them to sign up).
  const next = safeNextPath(new URL(request.url).searchParams.get("next"));
  if (next) {
    store.set(OAUTH_NEXT_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    });
  } else {
    store.delete(OAUTH_NEXT_COOKIE);
  }

  return NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
}
