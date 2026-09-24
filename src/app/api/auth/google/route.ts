import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildGoogleAuthUrl, generateOAuthState, OAUTH_STATE_COOKIE } from "@/lib/google-auth";
import { getBaseUrl } from "@/lib/qr";

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

  return NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
}
