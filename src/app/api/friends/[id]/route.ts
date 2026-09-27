import { NextResponse } from "next/server";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { addFriend, removeFriend } from "@/lib/friends";

export async function POST(_request: Request, ctx: RouteContext<"/api/friends/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { id } = await ctx.params;
  const targetId = Number(id);
  if (!getUserById(targetId)) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
  }
  if (targetId === user.id) {
    return NextResponse.json({ error: "O'zingizni do'stlarga qo'sha olmaysiz" }, { status: 400 });
  }

  addFriend(user.id, targetId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/friends/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { id } = await ctx.params;
  const targetId = Number(id);
  removeFriend(user.id, targetId);
  return NextResponse.json({ ok: true });
}
