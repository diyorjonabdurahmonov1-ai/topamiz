import { NextResponse } from "next/server";
import { createSession, isUserBlocked, setSessionCookie, type AuthUser } from "./auth";

export const CODE_ERRORS = {
  wrong: "Kod noto'g'ri. Qayta tekshirib kiriting.",
  expired: "Kod eskirgan. Yangi kod oling.",
  "too-many": "Juda ko'p noto'g'ri urinish. Yangi kod oling.",
} as const;

export function tooManyAttempts() {
  return NextResponse.json(
    { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
    { status: 429 }
  );
}

export async function signIn(user: AuthUser) {
  if (isUserBlocked(user.id)) {
    return NextResponse.json({ error: "Hisobingiz bloklangan." }, { status: 403 });
  }
  const { token, expiresAt } = createSession(user.id);
  await setSessionCookie(token, expiresAt);
  return NextResponse.json({ ok: true });
}
