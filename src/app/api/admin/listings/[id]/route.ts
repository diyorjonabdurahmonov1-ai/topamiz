import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { deleteListing, getListingById, setMysteryBox } from "@/lib/listings";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/listings/[id]">) {
  const admin = await getCurrentUser();
  if (!isAdmin(admin)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await ctx.params;
  if (!getListingById(id)) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  deleteListing(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/listings/[id]">) {
  const admin = await getCurrentUser();
  if (!isAdmin(admin)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await ctx.params;
  if (!getListingById(id)) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (typeof body?.isMysteryBox !== "boolean") {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  setMysteryBox(id, body.isMysteryBox);
  return NextResponse.json({ ok: true });
}
