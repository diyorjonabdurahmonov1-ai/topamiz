import { NextResponse } from "next/server";
import { BRAND_NAME, getCurrentUser, getUserById, isAdmin } from "@/lib/auth";
import { MAX_MESSAGE_LENGTH, sendMessage } from "@/lib/messages";
import { sendPushToUser } from "@/lib/push";

export async function POST(request: Request, ctx: RouteContext<"/api/admin/users/[id]/message">) {
  const admin = await getCurrentUser();
  if (!admin || !isAdmin(admin)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await ctx.params;
  const targetId = Number(id);
  const target = getUserById(targetId);
  if (!target) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
  if (!message) return NextResponse.json({ error: "Xabar matnini kiriting" }, { status: 400 });

  sendMessage({ senderId: admin.id, recipientId: targetId, body: message });

  void sendPushToUser(targetId, {
    title: BRAND_NAME,
    body: message,
    url: `/xabarlar/${admin.id}`,
  });

  return NextResponse.json({ ok: true });
}
