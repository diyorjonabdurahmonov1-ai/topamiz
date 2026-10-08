import { NextResponse } from "next/server";
import { getPhoneAccount, verifyPassword } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { normalizeUzPhone } from "@/lib/phone-login";
import { signIn, tooManyAttempts } from "@/lib/phone-auth-responses";

const WRONG = "Telefon raqam yoki parol noto'g'ri.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = normalizeUzPhone(typeof body?.phone === "string" ? body.phone : "");
  const password = typeof body?.password === "string" ? body.password : "";
  if (!phone || !password) return NextResponse.json({ error: WRONG }, { status: 400 });

  // Caps password guessing, both against one number and from one place.
  const byIp = rateLimit(`phone-login-ip:${getClientIp(request)}`, 30, 15 * 60 * 1000);
  const byPhone = rateLimit(`phone-login:${phone}`, 10, 15 * 60 * 1000);
  if (!byIp.allowed || !byPhone.allowed) return tooManyAttempts();

  const account = getPhoneAccount(phone);
  if (!account) return NextResponse.json({ error: "not-found", code: "not-found" }, { status: 404 });
  if (!account.passwordHash) {
    return NextResponse.json({ error: "no-password", code: "no-password" }, { status: 409 });
  }
  if (!verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: WRONG }, { status: 401 });
  }
  return signIn(account.user);
}
