import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

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

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return NextResponse.json({ url: `/api/uploads/${filename}` });
}
