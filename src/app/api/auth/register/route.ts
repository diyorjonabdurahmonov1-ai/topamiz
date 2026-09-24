import { NextResponse } from "next/server";
import {
  createSession,
  createUser,
  getUserByPhone,
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  normalizePhone,
  setSessionCookie,
} from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`register-ip:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const phoneRaw = typeof body?.phone === "string" ? body.phone : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";

  if (!name) {
    return NextResponse.json({ error: "Ismingizni kiriting" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Parol ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} belgidan iborat bo'lishi kerak` },
      { status: 400 }
    );
  }

  const phone = normalizePhone(phoneRaw);
  if (phone.length !== 13) {
    return NextResponse.json({ error: "Telefon raqami noto'g'ri" }, { status: 400 });
  }
  if (getUserByPhone(phone)) {
    return NextResponse.json(
      { error: "Bu raqam bilan foydalanuvchi allaqachon mavjud" },
      { status: 409 }
    );
  }

  const user = createUser(phone, password, name);
  const { token, expiresAt } = createSession(user.id);
  await setSessionCookie(token, expiresAt);

  return NextResponse.json({ user });
}
