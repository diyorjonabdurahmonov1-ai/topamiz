import { NextResponse } from "next/server";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { MAX_USER_REPORT_LENGTH, reportUser } from "@/lib/user-blocks";

// A report lands on the admin's Shikoyatlar page; nothing happens to the
// reported account automatically — a person decides.
export async function POST(request: Request, ctx: RouteContext<"/api/users/[id]/report">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const limit = rateLimit(`user-report:${user.id}:${getClientIp(request)}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." }, { status: 429 });
  }

  const { id } = await ctx.params;
  const reportedId = Number(id);
  if (!Number.isInteger(reportedId) || !getUserById(reportedId)) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, MAX_USER_REPORT_LENGTH) : "";
  const context = body?.context === "chat" ? "chat" : "profile";
  if (!reportUser({ reportedId, reporterId: user.id, reason, context })) {
    return NextResponse.json({ error: "O'zingiz ustingizdan shikoyat qilib bo'lmaydi" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
