import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { deleteAd, getAdById, MAX_AD_TITLE_LENGTH, moveAd, normalizeAdLink, setAdActive, updateAd } from "@/lib/ads";

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

// One of: { active }, { move: "up" | "down" }, or { linkUrl?, title? }.
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/ads/[id]">) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await ctx.params;
  const ad = getAdById(Number(id));
  if (!ad) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  const body = await request.json().catch(() => null);

  if (typeof body?.active === "boolean") {
    setAdActive(ad.id, body.active);
    return NextResponse.json({ ok: true });
  }
  if (body?.move === "up" || body?.move === "down") {
    moveAd(ad.id, body.move);
    return NextResponse.json({ ok: true });
  }
  if ("linkUrl" in (body ?? {}) || "title" in (body ?? {})) {
    const linkUrl = "linkUrl" in body ? normalizeAdLink(body.linkUrl) : undefined;
    if (linkUrl === null) {
      return NextResponse.json(
        { error: "Havola http:// yoki https:// bilan boshlanishi kerak (yoki bo'sh qoldiring)" },
        { status: 400 }
      );
    }
    const title =
      typeof body.title === "string" ? body.title.trim().slice(0, MAX_AD_TITLE_LENGTH) : undefined;
    updateAd(ad.id, { linkUrl, title });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
}
