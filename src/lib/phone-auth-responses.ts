import { NextResponse } from "next/server";
import { createSession, isUserBlocked, setSessionCookie, type AuthUser } from "./auth";

// Every error carries a stable `code`; the sign-in form shows its text in
// the visitor's language (dict.login.errors), and `error` is the Uzbek
// fallback for anything else reading the API.
const AUTH_ERRORS = {
  invalidPhone: "Faqat O'zbekiston (+998) raqami. Masalan: 90 123 45 67",
  tooMany: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.",
  smsNotConfigured: "SMS xizmati hozircha sozlanmagan.",
  recentlySent: "Kod yaqinda yuborildi. Biroz kuting.",
  smsFailed: "SMS yuborilmadi. Birozdan so'ng qayta urinib ko'ring.",
  codeWrong: "Kod noto'g'ri. Qayta tekshirib kiriting.",
  codeExpired: "Kod eskirgan. Yangi kod oling.",
  codeTooMany: "Juda ko'p noto'g'ri urinish. Yangi kod oling.",
  consentRequired: "Ro'yxatdan o'tish uchun shartlarga rozilik bildiring.",
  nameRequired: "Ismingizni kiriting.",
  nameReserved: "Bu ismni tanlab bo'lmaydi.",
  passwordShort: "Parol kamida 8 belgidan iborat bo'lishi kerak.",
  passwordLong: "Parol juda uzun.",
  passwordWeak: "Parolda kamida bitta harf va bitta raqam bo'lishi kerak.",
  loginWrong: "Telefon raqam yoki parol noto'g'ri.",
  blocked: "Hisobingiz bloklangan.",
  exists: "Bu raqam bilan akkaunt allaqachon bor.",
  notFound: "Bu raqam ro'yxatdan o'tmagan.",
  noPassword: "Bu akkauntda parol o'rnatilmagan.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

export function authError(code: AuthErrorCode, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: AUTH_ERRORS[code], code, ...extra }, { status });
}

export const CODE_RESULT_ERRORS = {
  wrong: "codeWrong",
  expired: "codeExpired",
  "too-many": "codeTooMany",
} as const satisfies Record<string, AuthErrorCode>;

export async function signIn(user: AuthUser) {
  if (isUserBlocked(user.id)) return authError("blocked", 403);
  const { token, expiresAt } = createSession(user.id);
  await setSessionCookie(token, expiresAt);
  return NextResponse.json({ ok: true });
}
