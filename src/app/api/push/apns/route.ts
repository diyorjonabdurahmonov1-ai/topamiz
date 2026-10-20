import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isApnsToken, removeApnsToken, saveApnsToken } from "@/lib/apns";
import { getLocale } from "@/lib/i18n/server";

// The iPhone app's APNs device token, sent by the site running inside it
// (lib/native-push.ts) once the user allows notifications, and again on each
// launch — tokens can change, and this also keeps the language current.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!isApnsToken(body?.token)) return NextResponse.json({ error: "Noto'g'ri token" }, { status: 400 });
  saveApnsToken(user.id, body.token, await getLocale());
  return NextResponse.json({ ok: true });
}

// Turning notifications off, or signing out in the app.
export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  if (isApnsToken(body?.token)) removeApnsToken(body.token);
  return NextResponse.json({ ok: true });
}
