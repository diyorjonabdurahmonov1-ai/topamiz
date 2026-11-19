import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { displayIdentity, getCurrentUser } from "@/lib/auth";
import { getTagByCode } from "@/lib/tags";
import { MAX_MESSAGE_LENGTH, sendMessage } from "@/lib/messages";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { sendPushToUser } from "@/lib/push";

export async function POST(request: Request, ctx: RouteContext<"/api/tags/[code]/contact">) {
  const { code } = await ctx.params;

  const ip = getClientIp(request);
  const ipLimit = rateLimit(`tag-contact-ip:${ip}`, 10, 60 * 60 * 1000);
  const codeLimit = rateLimit(`tag-contact-code:${code}`, 20, 60 * 60 * 1000);
  if (!ipLimit.allowed || !codeLimit.allowed) {
    const retryAfterSeconds = Math.max(ipLimit.retryAfterSeconds ?? 0, codeLimit.retryAfterSeconds ?? 0);
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const tag = getTagByCode(code);
  if (!tag) return await apiError("tagNotFound", 404);
  if (tag.status === "resolved") {
    return await apiError("tagResolved", 400);
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
  if (!message) {
    return await apiError("tagMessageRequired", 400);
  }

  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.id === tag.ownerId) {
    return await apiError("tagOwn", 400);
  }

  const guestName = typeof body?.guestName === "string" ? body.guestName.trim().slice(0, 80) : "";
  const guestPhone = typeof body?.guestPhone === "string" ? body.guestPhone.trim().slice(0, 30) : "";

  sendMessage({
    senderId: currentUser?.id ?? null,
    recipientId: tag.ownerId,
    body: message,
    tagId: tag.id,
    guestName: currentUser ? undefined : guestName || "Nomsiz",
    guestPhone: currentUser ? undefined : guestPhone || undefined,
  });

  void sendPushToUser(tag.ownerId, {
    title: currentUser ? displayIdentity(currentUser).name : guestName || "Nomsiz",
    body: message,
    url: currentUser ? `/xabarlar/${currentUser.id}` : "/xabarlar",
  });

  return NextResponse.json({ ok: true });
}
