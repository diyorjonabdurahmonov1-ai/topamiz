import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  db.prepare("UPDATE users SET is_premium = 1 WHERE id = ?").run(user.id);
  return NextResponse.json({ ok: true });
}
