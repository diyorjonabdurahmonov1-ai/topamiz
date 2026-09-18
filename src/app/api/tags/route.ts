import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { countActiveTags, createTag, FREE_TAG_LIMIT } from "@/lib/tags";
import { generateQrDataUrl, getBaseUrl, tagUrl } from "@/lib/qr";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  if (!user.isPremium && countActiveTags(user.id) >= FREE_TAG_LIMIT) {
    return NextResponse.json(
      {
        error: `Bepul rejada faqat ${FREE_TAG_LIMIT} ta QR-belgi yaratish mumkin. Cheksiz belgi uchun Premium oling.`,
        limitReached: true,
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const photoUrls = Array.isArray(body?.photoUrls)
    ? body.photoUrls.filter((u: unknown): u is string => typeof u === "string")
    : [];

  if (!title || !description) {
    return NextResponse.json(
      { error: "Buyum nomi va tasnifini kiriting" },
      { status: 400 }
    );
  }

  const tag = createTag({ ownerId: user.id, title, description, photoUrls });
  const url = tagUrl(getBaseUrl(request), tag.code);
  const qrDataUrl = await generateQrDataUrl(url);

  return NextResponse.json({ tag, qrDataUrl, url });
}
