import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { deleteAd, getAdById, setAdActive } from "@/lib/ads";

const UPLOAD_DIR = path.join(process.cwd(), ".uploads");

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/ads/[id]">) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await ctx.params;
  const ad = getAdById(Number(id));
  if (!ad) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  deleteAd(ad.id);

  const filename = ad.mediaUrl.split("/").pop();
  if (filename) {
    await unlink(path.join(UPLOAD_DIR, path.basename(filename))).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/ads/[id]">) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const active = typeof body?.active === "boolean" ? body.active : null;
  if (active === null) return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  const ok = setAdActive(Number(id), active);
  if (!ok) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
