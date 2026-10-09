import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordError } from "@/lib/error-log";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const MAX_BODY = 8 * 1024;

// Crashes in visitors' browsers (see components/ErrorReporter.tsx). Open to
// signed-out visitors too — they're most of the traffic — so it's capped
// per IP and per request size, and every field is truncated.
export async function POST(request: Request) {
  const limit = rateLimit(`client-errors:${getClientIp(request)}`, 20, 10 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ ok: true });

  const text = await request.text().catch(() => "");
  if (!text || text.length > MAX_BODY) return NextResponse.json({ ok: true });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: true });
  }
  const field = (key: string) => (typeof body[key] === "string" ? (body[key] as string) : "");
  const message = field("message");
  if (!message) return NextResponse.json({ ok: true });

  const user = await getCurrentUser().catch(() => null);
  recordError({
    kind: "client",
    message,
    source: field("source"),
    detail: field("stack"),
    path: field("path"),
    userAgent: request.headers.get("user-agent") ?? "",
    userId: user?.id ?? null,
  });
  return NextResponse.json({ ok: true });
}
