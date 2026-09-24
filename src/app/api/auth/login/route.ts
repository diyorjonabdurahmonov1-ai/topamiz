import { NextResponse } from "next/server";
import {
  createSession,
  getUserByPhone,
  getUserPasswordHash,
  MAX_PASSWORD_LENGTH,
  normalizePhone,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipLimit = rateLimit(`login-ip:${ip}`, 20, 10 * 60 * 1000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const phoneRaw = typeof body?.phone === "string" ? body.phone : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const phone = normalizePhone(phoneRaw);

  const phoneLimit = rateLimit(`login-phone:${phone}`, 8, 10 * 60 * 1000);
  if (!phoneLimit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(phoneLimit.retryAfterSeconds) } }
    );
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: "Telefon raqam yoki parol noto'g'ri" },
      { status: 401 }
    );
  }

  const storedHash = getUserPasswordHash(phone);
  if (!storedHash || !verifyPassword(password, storedHash)) {
    return NextResponse.json(
      { error: "Telefon raqam yoki parol noto'g'ri" },
      { status: 401 }
    );
  }

  const user = getUserByPhone(phone)!;
  const { token, expiresAt } = createSession(user.id);
  await setSessionCookie(token, expiresAt);

  return NextResponse.json({ user });
}
