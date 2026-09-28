import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { deleteListing, getListingById, setListingStatus } from "@/lib/listings";

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

  setListingStatus(id, status);
  return NextResponse.json({ ok: true });
}
