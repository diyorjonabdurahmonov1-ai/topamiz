import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { createAd, MAX_AD_LINK_LENGTH, MAX_AD_TITLE_LENGTH } from "@/lib/ads";
import { matchesMediaSignature, mediaKindFor } from "@/lib/media-signature";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // stays under Caddy's 20MB request_body cap
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};
const UPLOAD_DIR = path.join(process.cwd(), ".uploads");

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const limit = rateLimit(`admin-ad-upload:${ip}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const linkUrlRaw = formData.get("linkUrl");
  const titleRaw = formData.get("title");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  const mediaType = mediaKindFor(file.type);
  if (!ext || !mediaType) {
    return NextResponse.json(
      { error: "Faqat JPG, PNG, WEBP, GIF rasm yoki MP4, WEBM video qabul qilinadi" },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Fayl hajmi 15MB dan oshmasligi kerak" }, { status: 400 });
  }

  const linkUrl =
    typeof linkUrlRaw === "string" ? linkUrlRaw.trim().slice(0, MAX_AD_LINK_LENGTH) : "";
  if (!/^https?:\/\//i.test(linkUrl)) {
    return NextResponse.json(
      { error: "To'g'ri havola kiriting (http:// yoki https:// bilan)" },
      { status: 400 }
    );
  }
  const title = typeof titleRaw === "string" ? titleRaw.trim().slice(0, MAX_AD_TITLE_LENGTH) : "";

  const buffer = Buffer.from(await file.arrayBuffer());
  // The browser's Content-Type is just a label the client chose — confirm
  // the bytes themselves actually match the format they claim to be.
  if (!matchesMediaSignature(buffer, file.type)) {
    return NextResponse.json(
      { error: "Fayl mazmuni haqiqiy formatga mos kelmadi" },
      { status: 400 }
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const ad = createAd({
    mediaUrl: `/api/uploads/${filename}`,
    mediaType,
    linkUrl,
    title,
  });

  return NextResponse.json({ ad });
}
