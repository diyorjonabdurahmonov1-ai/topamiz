import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { setAdInquiryHandled } from "@/lib/ad-inquiries";

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/ad-inquiries/[id]">) {
  const admin = await getCurrentUser();
  if (!isAdmin(admin)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const handled = body?.handled !== false;

  const ok = setAdInquiryHandled(Number(id), handled);
  if (!ok) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
