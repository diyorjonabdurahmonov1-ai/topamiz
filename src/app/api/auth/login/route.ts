import { NextResponse } from "next/server";
import {
  createSession,
  getUserByPhone,
  getUserPasswordHash,
  normalizePhone,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phoneRaw = typeof body?.phone === "string" ? body.phone : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const phone = normalizePhone(phoneRaw);
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
