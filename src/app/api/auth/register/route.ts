import { NextResponse } from "next/server";
import {
  createSession,
  createUser,
  getUserByPhone,
  normalizePhone,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phoneRaw = typeof body?.phone === "string" ? body.phone : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Ismingizni kiriting" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Parol kamida 6 belgidan iborat bo'lishi kerak" },
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
