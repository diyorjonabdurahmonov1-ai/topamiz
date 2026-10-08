import { NextResponse } from "next/server";
import { createSession, findOrCreatePhoneUser, isUserBlocked, setSessionCookie } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { checkLoginCode, normalizeUzPhone } from "@/lib/phone-login";

const RESULT_ERRORS = {
  wrong: "Kod noto'g'ri. Qayta tekshirib kiriting.",
  expired: "Kod eskirgan. Yangi kod oling.",
  "too-many": "Juda ko'p noto'g'ri urinish. Yangi kod oling.",
} as const;

export async function POST(request: Request) {
  const limit = rateLimit(`phone-verify-ip:${getClientIp(request)}`, 30, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const phone = normalizeUzPhone(typeof body?.phone === "string" ? body.phone : "");
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!phone || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: RESULT_ERRORS.wrong }, { status: 400 });
  }

  const result = checkLoginCode(phone, code);
  if (result !== "ok") return NextResponse.json({ error: RESULT_ERRORS[result] }, { status: 400 });

  const user = findOrCreatePhoneUser(phone);
  if (isUserBlocked(user.id)) {
    return NextResponse.json({ error: "Hisobingiz bloklangan." }, { status: 403 });
  }
  const { token, expiresAt } = createSession(user.id);
  await setSessionCookie(token, expiresAt);
  return NextResponse.json({ ok: true });
}
