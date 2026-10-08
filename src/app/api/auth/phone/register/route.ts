import { NextResponse } from "next/server";
import { MAX_NAME_LENGTH, createPhoneUser, getPhoneAccount, isReservedName } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { checkCode, normalizeUzPhone, passwordProblem } from "@/lib/phone-login";
import { CODE_ERRORS, signIn, tooManyAttempts } from "@/lib/phone-auth-responses";

export async function POST(request: Request) {
  if (!rateLimit(`phone-register-ip:${getClientIp(request)}`, 30, 60 * 60 * 1000).allowed) {
    return tooManyAttempts();
  }

  const body = await request.json().catch(() => null);
  const phone = normalizeUzPhone(typeof body?.phone === "string" ? body.phone : "");
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  if (!phone || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: CODE_ERRORS.wrong }, { status: 400 });
  }
  if (body?.acceptTerms !== true) {
    return NextResponse.json(
      { error: "Ro'yxatdan o'tish uchun shartlarga rozilik bildiring." },
      { status: 400 }
    );
  }
  if (name.length < 2) return NextResponse.json({ error: "Ismingizni kiriting." }, { status: 400 });
  if (isReservedName(name)) {
    return NextResponse.json({ error: "Bu ismni tanlab bo'lmaydi." }, { status: 400 });
  }
  const badPassword = passwordProblem(body?.password);
  if (badPassword) return NextResponse.json({ error: badPassword }, { status: 400 });

  if (getPhoneAccount(phone)) {
    return NextResponse.json({ error: "exists", code: "exists" }, { status: 409 });
  }
  const result = checkCode("register", phone, code);
  if (result !== "ok") return NextResponse.json({ error: CODE_ERRORS[result] }, { status: 400 });

  return signIn(createPhoneUser({ phone, name, password: body.password }));
}
