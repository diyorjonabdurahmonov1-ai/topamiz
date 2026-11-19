import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { getCurrentUser } from "@/lib/auth";
import { isFcmToken, removeFcmToken, saveFcmToken } from "@/lib/fcm";
import { getLocale } from "@/lib/i18n/server";

// The Android app's FCM registration token, sent by the site running inside it
// (lib/native-push.ts) once the user allows notifications, and again on each
// launch — tokens can change, and this also keeps the language current.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);
  const body = await request.json().catch(() => null);
  if (!isFcmToken(body?.token)) return await apiError("invalidRequest", 400);
  saveFcmToken(user.id, body.token, await getLocale());
  return NextResponse.json({ ok: true });
}

// Turning notifications off, or signing out in the app.
export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  if (isFcmToken(body?.token)) removeFcmToken(body.token);
  return NextResponse.json({ ok: true });
}
