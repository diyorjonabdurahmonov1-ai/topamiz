import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isR2Configured } from "@/lib/r2";
import { ALLOWED_TYPES, CHUNK_SIZE, MAX_RAW_SIZE, createUploadSession } from "@/lib/video-uploads";

// Starts a chunked upload. The file itself then arrives in CHUNK_SIZE pieces
// via PUT /api/upload-video/[id], so no single request has to carry a whole
// phone video past the reverse proxy's body-size limit.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Video yuklash hozircha sozlanmagan. Birozdan so'ng qayta urinib ko'ring." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const type = typeof body?.type === "string" ? body.type : "";
  const size = typeof body?.size === "number" ? body.size : 0;
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Faqat MP4, MOV yoki WEBM video qabul qilinadi" }, { status: 400 });
  }
  if (!Number.isInteger(size) || size <= 0) {
    return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
  }
  if (size > MAX_RAW_SIZE) {
    return NextResponse.json({ error: "Video hajmi 300MB dan oshmasligi kerak" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limit = rateLimit(`upload-video:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p video yuklandi. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const session = await createUploadSession(user.id, size);
  return NextResponse.json({ uploadId: session.id, chunkSize: CHUNK_SIZE });
}
