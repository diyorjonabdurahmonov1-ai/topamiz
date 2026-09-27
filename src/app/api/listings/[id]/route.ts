import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { deleteListing, getListingById } from "@/lib/listings";

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
