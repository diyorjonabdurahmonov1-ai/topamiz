import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { deleteListing, getListingById, setListingStatus } from "@/lib/listings";
import { getListingClaimants } from "@/lib/messages";

// Public, read-only, and deliberately thin — just enough for a forwarded
// listing's share-card preview in a chat thread, never the full record
// (contact details, exact coordinates) a stranger shouldn't get via a bare
// fetch.
export async function GET(_request: Request, ctx: RouteContext<"/api/listings/[id]">) {
  const { id } = await ctx.params;
  const listing = getListingById(id);
  if (!listing) return await apiError("notFound", 404);

  return NextResponse.json({
    listing: {
      id: listing.id,
      title: listing.title,
      city: listing.city,
      reward: listing.reward ?? null,
      kind: listing.kind,
      isMysteryBox: listing.isMysteryBox,
      status: listing.status,
      thumbnailUrl: listing.videoThumbnailUrl ?? listing.photoUrls[0] ?? null,
    },
  });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/listings/[id]">) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  const { id } = await ctx.params;
  const listing = getListingById(id, { includeHidden: true });
  if (!listing) return await apiError("notFound", 404);

  if (listing.ownerId !== user.id && !isAdmin(user)) {
    return await apiError("forbidden", 403);
  }

  deleteListing(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/listings/[id]">) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  const { id } = await ctx.params;
  const listing = getListingById(id, { includeHidden: true });
  if (!listing) return await apiError("notFound", 404);

  if (listing.ownerId !== user.id && !isAdmin(user)) {
    return await apiError("forbidden", 403);
  }

  const body = await request.json().catch(() => null);
  const status = body?.status === "active" || body?.status === "resolved" ? body.status : null;
  if (!status) return await apiError("invalidStatus", 400);

  // Crediting a specific finder only ever comes from the owner picking one
  // of the actual "found it!" claims on this listing — never an arbitrary
  // user id — so a fabricated request can't credit someone who never claimed it.
  let resolvedBy: number | null = null;
  if (status === "resolved" && typeof body?.resolvedBy === "number") {
    const isRealClaimant = getListingClaimants(Number(id), listing.ownerId ?? -1).some(
      (c) => c.sender.id === body.resolvedBy
    );
    if (isRealClaimant) resolvedBy = body.resolvedBy;
  }

  setListingStatus(id, status, resolvedBy);
  return NextResponse.json({ ok: true });
}
