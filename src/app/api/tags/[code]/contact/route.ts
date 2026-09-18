import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTagByCode } from "@/lib/tags";
import { sendMessage } from "@/lib/messages";

export async function POST(request: Request, ctx: RouteContext<"/api/tags/[code]/contact">) {
  const { code } = await ctx.params;
  const tag = getTagByCode(code);
  if (!tag) return NextResponse.json({ error: "Belgi topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Xabar matnini kiriting" }, { status: 400 });
  }

  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.id === tag.ownerId) {
    return NextResponse.json({ error: "Bu sizning o'z belgingiz" }, { status: 400 });
  }

  const guestName = typeof body?.guestName === "string" ? body.guestName.trim().slice(0, 80) : "";
  const guestPhone = typeof body?.guestPhone === "string" ? body.guestPhone.trim().slice(0, 30) : "";

  sendMessage({
    senderId: currentUser?.id ?? null,
    recipientId: tag.ownerId,
    body: message,
    tagId: tag.id,
    guestName: currentUser ? undefined : guestName || "Nomsiz",
    guestPhone: currentUser ? undefined : guestPhone || undefined,
  });

  return NextResponse.json({ ok: true });
}
