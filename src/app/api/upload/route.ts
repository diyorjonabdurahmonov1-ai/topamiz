import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { matchesImageSignature } from "@/lib/image-signature";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
// Kept outside /public: next start serves /public from a manifest snapshotted
// at build time, so files written here at request time would 404 until the
// next rebuild. The /api/uploads/[filename] route reads this dir fresh instead.
const UPLOAD_DIR = path.join(process.cwd(), ".uploads");

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
      { error: "Fayl hajmi 5MB dan oshmasligi kerak" },
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

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return NextResponse.json({ url: `/api/uploads/${filename}` });
}
