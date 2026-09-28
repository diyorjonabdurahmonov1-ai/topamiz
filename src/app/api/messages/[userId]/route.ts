import { NextResponse } from "next/server";
import { displayIdentity, getCurrentUser, getUserById } from "@/lib/auth";
import { getThread, markThreadRead, MAX_MESSAGE_LENGTH, MAX_MESSAGE_PHOTOS, sendMessage } from "@/lib/messages";
import { rateLimit } from "@/lib/rate-limit";
import { sendPushToUser } from "@/lib/push";

// Uploaded photos only ever come back from POST /api/upload as this prefix —
// anything else is a client claiming an arbitrary external URL is one of ours.
const OWN_UPLOAD_PREFIX = "/api/uploads/";

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

  const limit = rateLimit(`send-message:${user.id}`, 30, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda tez-tez xabar yubormoqdasiz. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
  if (!text) return NextResponse.json({ error: "Xabar bo'sh bo'lishi mumkin emas" }, { status: 400 });
  const photoUrls = Array.isArray(body?.photoUrls)
    ? body.photoUrls
        .filter((u: unknown): u is string => typeof u === "string" && u.startsWith(OWN_UPLOAD_PREFIX))
        .slice(0, MAX_MESSAGE_PHOTOS)
    : [];

  const message = sendMessage({ senderId: user.id, recipientId: otherId, body: text, photoUrls });

  const senderIdentity = displayIdentity(user);
  void sendPushToUser(otherId, {
    title: senderIdentity.name,
    body: text,
    url: `/xabarlar/${user.id}`,
  });

  return NextResponse.json({ message });
}
