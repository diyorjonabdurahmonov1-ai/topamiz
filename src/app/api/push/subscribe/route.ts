import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { getCurrentUser } from "@/lib/auth";
import { saveSubscription } from "@/lib/push";
import { getLocale } from "@/lib/i18n/server";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : "";
  if (!endpoint || !p256dh || !auth) {
    return await apiError("invalidRequest", 400);
  }

  saveSubscription(user.id, { endpoint, keys: { p256dh, auth } }, await getLocale());
  return NextResponse.json({ ok: true });
}
