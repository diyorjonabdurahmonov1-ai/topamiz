import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { getCurrentUser } from "@/lib/auth";
import { getListingById } from "@/lib/listings";
import { addComment, getCommentRow, getComments, MAX_COMMENT_LENGTH } from "@/lib/listing-comments";
import { containsProhibitedContent, recordModerationViolation } from "@/lib/moderation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";
import { isBlockedBetween } from "@/lib/user-blocks";

export async function GET(_request: Request, ctx: RouteContext<"/api/listings/[id]/comments">) {
  const { id } = await ctx.params;
  const listing = getListingById(id);
  if (!listing) return await apiError("notFound", 404);

  const viewer = await getCurrentUser();
  return NextResponse.json({ comments: getComments(Number(id), viewer?.id) });
}

export async function POST(request: Request, ctx: RouteContext<"/api/listings/[id]/comments">) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  const ip = getClientIp(request);
  const limit = rateLimit(`listing-comment:${ip}`, 20, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const { id } = await ctx.params;
  const listing = getListingById(id);
  if (!listing) return await apiError("notFound", 404);

  const body = await request.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, MAX_COMMENT_LENGTH) : "";
  if (!text) return await apiError("commentEmpty", 400);

  if (containsProhibitedContent(text)) {
    const { blocked } = recordModerationViolation(user.id);
    return await apiError(blocked ? "commentRejectedBlocked" : "commentRejected", 400, {}, { blocked });
  }

  // A reply names the comment it answers. Replies stay one level deep, as on
  // Instagram: answering a reply hangs the new one under the same top-level
  // comment, addressed to whoever wrote that reply.
  let parentId: number | null = null;
  let replyToUserId: number | null = null;
  if (body?.replyTo !== undefined && body?.replyTo !== null) {
    const target = getCommentRow(Number(body.replyTo));
    if (!target || target.listing_id !== Number(id)) return await apiError("notFound", 404);
    parentId = target.parent_id ?? target.id;
    replyToUserId = target.user_id;
  }

  if (listing.ownerId && isBlockedBetween(user.id, listing.ownerId)) {
    return await apiError("commentsClosed", 403);
  }
  if (replyToUserId && isBlockedBetween(user.id, replyToUserId)) {
    return await apiError("commentsClosed", 403);
  }

  const comment = addComment({ listingId: Number(id), userId: user.id, body: text, parentId, replyToUserId });
  // Whoever was answered hears about it; the listing's owner hears about
  // every comment on their listing unless that was already them.
  if (replyToUserId) {
    notify({ userId: replyToUserId, type: "comment_reply", actorId: user.id, listingId: Number(id) });
  }
  if (listing.ownerId && listing.ownerId !== replyToUserId) {
    notify({ userId: listing.ownerId, type: "listing_comment", actorId: user.id, listingId: Number(id) });
  }
  return NextResponse.json({ comment });
}
