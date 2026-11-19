import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { containsProhibitedContent, recordModerationViolation } from "@/lib/moderation";
import { isBlockedBetween } from "@/lib/user-blocks";
import { displayIdentity, getCurrentUser, getUserById, isAdmin, isUserBlocked } from "@/lib/auth";
import { getListingById } from "@/lib/listings";
import { getThread, markThreadRead, MAX_MESSAGE_LENGTH, MAX_MESSAGE_PHOTOS, sendMessage } from "@/lib/messages";
import { rateLimit } from "@/lib/rate-limit";
import { sendPushToUser } from "@/lib/push";
import { isOwnUploadUrl } from "@/lib/upload-url";

// Uploaded photos only ever come back from POST /api/upload as this prefix —
// anything else is a client claiming an arbitrary external URL is one of ours.

export async function GET(_request: Request, ctx: RouteContext<"/api/messages/[userId]">) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  const { userId } = await ctx.params;
  const otherId = Number(userId);
  if (!getUserById(otherId) || (isUserBlocked(otherId) && !isAdmin(user))) {
    return await apiError("userNotFound", 404);
  }

  markThreadRead(user.id, otherId);
  return NextResponse.json({ messages: getThread(user.id, otherId) });
}

export async function POST(request: Request, ctx: RouteContext<"/api/messages/[userId]">) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  const { userId } = await ctx.params;
  const otherId = Number(userId);
  const recipient = getUserById(otherId);
  if (!recipient || (isUserBlocked(otherId) && !isAdmin(user))) {
    return await apiError("userNotFound", 404);
  }
  if (otherId === user.id) {
    return await apiError("cannotMessageSelf", 400);
  }

  const limit = rateLimit(`send-message:${user.id}`, 30, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda tez-tez xabar yubormoqdasiz. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  if (isBlockedBetween(user.id, otherId)) {
    return await apiError("cannotMessage", 403, {}, { code: "blocked" });
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
  if (!text) return await apiError("messageEmpty", 400);

  // The same filter as listings and comments: chats are private, but
  // harassment in them is exactly what it's there to stop.
  if (containsProhibitedContent(text)) {
    const { blocked } = recordModerationViolation(user.id);
    return await apiError(blocked ? "messageRejectedBlocked" : "messageRejected", 400, {}, { code: "prohibited", blocked });
  }
  const photoUrls = Array.isArray(body?.photoUrls)
    ? body.photoUrls
        .filter(isOwnUploadUrl)
        .slice(0, MAX_MESSAGE_PHOTOS)
    : [];

  // A "found it" claim only gets tied to the listing when it's genuinely
  // about it — sent to that listing's own owner while it's still active —
  // so a claimant can't tag an arbitrary listing onto an unrelated message.
  const listingIdRaw = body?.listingId;
  let listingId: number | undefined;
  if (typeof listingIdRaw === "number" && Number.isInteger(listingIdRaw)) {
    const listing = getListingById(String(listingIdRaw));
    if (listing && listing.ownerId === otherId && listing.status === "active") {
      listingId = listingIdRaw;
    }
  }

  const message = sendMessage({ senderId: user.id, recipientId: otherId, body: text, photoUrls, listingId });

  const senderIdentity = displayIdentity(user);
  void sendPushToUser(otherId, {
    title: senderIdentity.name,
    body: text,
    url: `/xabarlar/${user.id}`,
    tag: `chat-${user.id}`,
  });

  return NextResponse.json({ message });
}
