import { NextResponse } from "next/server";
import { matchesImageSignature } from "@/lib/image-signature";
import { encodeUpload, saveUpload, UnreadableImageError } from "@/lib/images";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Phones shrink photos before sending them (lib/image-prepare.ts), so this
// only matters when that couldn't run — kept under Caddy's 20MB body limit.
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`upload:${ip}`, 30, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p fayl yuklandi. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Faqat JPG, PNG, WEBP yoki GIF rasm qabul qilinadi" },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Fayl hajmi 15MB dan oshmasligi kerak" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // The browser's Content-Type is just a label the client chose — confirm
  // the bytes themselves are actually the image format they claim to be.
  if (!matchesImageSignature(buffer, file.type)) {
    return NextResponse.json(
      { error: "Fayl mazmuni haqiqiy rasm formatiga mos kelmadi" },
      { status: 400 }
    );
  }

  // Re-encoded rather than stored as sent: drops EXIF (the GPS position
  // above all), fixes rotation and caps the size — see lib/images.ts.
  let encoded: Buffer;
  try {
    encoded = await encodeUpload(buffer, ext === "gif");
  } catch (err) {
    if (!(err instanceof UnreadableImageError)) throw err;
    return NextResponse.json(
      { error: "Rasmni o'qib bo'lmadi — boshqa rasm tanlab ko'ring" },
      { status: 400 }
    );
  }
  const filename = await saveUpload(encoded, "webp");

  return NextResponse.json({ url: `/api/uploads/${filename}` });
}
