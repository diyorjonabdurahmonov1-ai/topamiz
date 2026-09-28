import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { deleteListing, getListingById, setListingStatus } from "@/lib/listings";
import { getListingClaimants } from "@/lib/messages";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/listings/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { id } = await ctx.params;
  const listing = getListingById(id);
  if (!listing) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  if (listing.ownerId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  deleteListing(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/listings/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { id } = await ctx.params;
  const listing = getListingById(id);
  if (!listing) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  if (listing.ownerId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status === "active" || body?.status === "resolved" ? body.status : null;
  if (!status) return NextResponse.json({ error: "Noto'g'ri holat" }, { status: 400 });

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
