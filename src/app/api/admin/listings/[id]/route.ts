import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { deleteListing, getListingById } from "@/lib/listings";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/listings/[id]">) {
  const admin = await getCurrentUser();
  if (!isAdmin(admin)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await ctx.params;
  if (!getListingById(id)) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  deleteListing(id);
  return NextResponse.json({ ok: true });
}
