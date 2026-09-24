import { NextResponse } from "next/server";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { getThread, markThreadRead, sendMessage } from "@/lib/messages";

export async function GET(_request: Request, ctx: RouteContext<"/api/messages/[userId]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { userId } = await ctx.params;
  const otherId = Number(userId);
  if (!getUserById(otherId)) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
  }

  markThreadRead(user.id, otherId);
  return NextResponse.json({ messages: getThread(user.id, otherId) });
}

export async function POST(request: Request, ctx: RouteContext<"/api/messages/[userId]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { userId } = await ctx.params;
  const otherId = Number(userId);
  const recipient = getUserById(otherId);
  if (!recipient) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
  }
  if (otherId === user.id) {
    return NextResponse.json({ error: "O'zingizga xabar yubora olmaysiz" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "Xabar bo'sh bo'lishi mumkin emas" }, { status: 400 });

  const message = sendMessage({ senderId: user.id, recipientId: otherId, body: text });
  return NextResponse.json({ message });
}
