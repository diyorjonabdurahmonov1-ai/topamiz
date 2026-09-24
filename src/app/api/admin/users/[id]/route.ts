import { NextResponse } from "next/server";
import { blockUser, unblockUser } from "@/lib/admin-users";
import { getCurrentUser, getUserById, isAdmin } from "@/lib/auth";

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/users/[id]">) {
  const admin = await getCurrentUser();
  if (!isAdmin(admin)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await ctx.params;
  const targetId = Number(id);
  const target = getUserById(targetId);
  if (!target) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const blocked = typeof body?.blocked === "boolean" ? body.blocked : null;
  if (blocked === null) return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  if (blocked && isAdmin(target)) {
    return NextResponse.json({ error: "Adminni bloklab bo'lmaydi" }, { status: 400 });
  }

  const ok = blocked ? blockUser(targetId) : unblockUser(targetId);
  if (!ok) return NextResponse.json({ error: "Amalga oshmadi" }, { status: 400 });

  return NextResponse.json({ ok: true });
}
