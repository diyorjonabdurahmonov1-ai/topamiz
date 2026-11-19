import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { getCurrentUser } from "@/lib/auth";
import { getListingById } from "@/lib/listings";
import { addComment, getComments, MAX_COMMENT_LENGTH } from "@/lib/listing-comments";
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

  if (listing.ownerId && isBlockedBetween(user.id, listing.ownerId)) {
    return await apiError("commentsClosed", 403);
  }

  const comment = addComment({ listingId: Number(id), userId: user.id, body: text });
  if (listing.ownerId) {
    notify({ userId: listing.ownerId, type: "listing_comment", actorId: user.id, listingId: Number(id) });
  }
  return NextResponse.json({ comment });
}
