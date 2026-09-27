import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveSubscription } from "@/lib/push";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : "";
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Noto'g'ri obuna ma'lumoti" }, { status: 400 });
  }

  saveSubscription(user.id, { endpoint, keys: { p256dh, auth } });
  return NextResponse.json({ ok: true });
}
