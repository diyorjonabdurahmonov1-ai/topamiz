import { NextResponse } from "next/server";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { addFriend, isFriend, removeFriend } from "@/lib/friends";
import { notify, removeNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(_request: Request, ctx: RouteContext<"/api/friends/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  // Each add notifies (and pushes to) the other person, so adding and
  // removing someone in a loop would flood their phone.
  const limit = rateLimit(`friend-add:${user.id}`, 30, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const { id } = await ctx.params;
  const targetId = Number(id);
  if (!getUserById(targetId)) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
  }
  if (targetId === user.id) {
    return NextResponse.json({ error: "O'zingizni do'stlarga qo'sha olmaysiz" }, { status: 400 });
  }

  const alreadyFriend = isFriend(user.id, targetId);
  addFriend(user.id, targetId);
  if (!alreadyFriend) notify({ userId: targetId, type: "friend_added", actorId: user.id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/friends/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { id } = await ctx.params;
  const targetId = Number(id);
  removeFriend(user.id, targetId);
  removeNotification({ userId: targetId, type: "friend_added", actorId: user.id });
  return NextResponse.json({ ok: true });
}
