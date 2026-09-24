import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession, findOrCreateGoogleUser, setSessionCookie } from "@/lib/auth";
import { exchangeGoogleCode, OAUTH_STATE_COOKIE } from "@/lib/google-auth";
import { getBaseUrl } from "@/lib/qr";

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const storedState = store.get(OAUTH_STATE_COOKIE)?.value;
  store.delete(OAUTH_STATE_COOKIE);

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}/kirish?error=oauth`);
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const profile = await exchangeGoogleCode(code, redirectUri);
    if (!profile.emailVerified) {
      return NextResponse.redirect(`${baseUrl}/kirish?error=unverified`);
    }

    const user = findOrCreateGoogleUser(profile);
    const { token, expiresAt } = createSession(user.id);
    await setSessionCookie(token, expiresAt);

    return NextResponse.redirect(`${baseUrl}/profil`);
  } catch {
    return NextResponse.redirect(`${baseUrl}/kirish?error=oauth`);
  }
}
