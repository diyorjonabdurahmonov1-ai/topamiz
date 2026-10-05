import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clearSessionCookie,
  deleteUserAccount,
  getCurrentUser,
  isAdmin,
  isReservedName,
  MAX_BIO_LENGTH,
  MAX_NAME_LENGTH,
} from "@/lib/auth";

// Uploaded photos only ever come back from POST /api/upload as this prefix —
// anything else is a client claiming an arbitrary external URL is one of ours.
const OWN_UPLOAD_PREFIX = "/api/uploads/";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (typeof body?.name === "string") {
    const name = body.name.trim().slice(0, MAX_NAME_LENGTH);
    if (!name) {
      return NextResponse.json({ error: "Ism bo'sh bo'lishi mumkin emas" }, { status: 400 });
    }
    if (isReservedName(name) && !isAdmin(user)) {
      return NextResponse.json({ error: "Bu ism band, boshqa ism tanlang" }, { status: 400 });
    }
    updates.push("name = ?");
    values.push(name);
  }

  if (typeof body?.bio === "string") {
    updates.push("bio = ?");
    values.push(body.bio.trim().slice(0, MAX_BIO_LENGTH));
  }

  if (typeof body?.avatarUrl === "string" && body.avatarUrl.startsWith(OWN_UPLOAD_PREFIX)) {
    updates.push("avatar_url = ?");
    values.push(body.avatarUrl);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Yangilanadigan ma'lumot topilmadi" }, { status: 400 });
  }

  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values, user.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  deleteUserAccount(user.id);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
