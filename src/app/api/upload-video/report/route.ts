import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Client-side upload failures (a phone refusing to read the picked file, a
// network path that never succeeds) never reach the server on their own —
// this logs them to the PM2 log (`pm2 logs topamiz`) so they can be
// diagnosed from the real device's details.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const limit = rateLimit(`upload-video-report:${getClientIp(request)}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ ok: true });

  const body = await request.json().catch(() => null);
  const field = (key: string, max = 300) => String(body?.[key] ?? "").slice(0, max);
  console.warn(
    "[video-upload-failure]",
    JSON.stringify({
      userId: user.id,
      code: field("code"),
      type: field("type", 100),
      ext: field("ext", 20),
      size: Number(body?.size) || 0,
      modifiedAgoSeconds: Number(body?.modifiedAgoSeconds) || 0,
      userAgent: field("userAgent"),
    })
  );
  return NextResponse.json({ ok: true });
}
