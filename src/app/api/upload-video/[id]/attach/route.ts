import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getListingOwnerId } from "@/lib/listings";
import { attachToListing, getUploadSession } from "@/lib/video-uploads";

// Called right after a listing is published while its video is still
// uploading: from here on the server fills the video into that listing
// itself, so the poster doesn't have to stay on the page for it.
export async function POST(request: Request, ctx: RouteContext<"/api/upload-video/[id]/attach">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { id } = await ctx.params;
  const session = getUploadSession(id, user.id);
  if (!session) {
    return NextResponse.json({ error: "Yuklash topilmadi. Videoni qaytadan tanlang." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const listingId = typeof body?.listingId === "string" ? body.listingId : "";
  if (!listingId || getListingOwnerId(listingId) !== user.id) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  if (attachToListing(session, listingId) === "failed") {
    return NextResponse.json({ error: session.error ?? "Video yuklanmadi" }, { status: 409 });
  }
  return NextResponse.json({ status: session.status });
}
