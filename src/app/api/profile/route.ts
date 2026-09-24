import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, MAX_BIO_LENGTH, MAX_NAME_LENGTH } from "@/lib/auth";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  const bio = typeof body?.bio === "string" ? body.bio.trim().slice(0, MAX_BIO_LENGTH) : "";

  if (!name) {
    return NextResponse.json({ error: "Ism bo'sh bo'lishi mumkin emas" }, { status: 400 });
  }

  db.prepare("UPDATE users SET name = ?, bio = ? WHERE id = ?").run(name, bio, user.id);
  return NextResponse.json({ ok: true });
}
