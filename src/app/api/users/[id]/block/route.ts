import { NextResponse } from "next/server";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { blockUserFor, unblockUserFor } from "@/lib/user-blocks";

async function target(ctx: RouteContext<"/api/users/[id]/block">) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 }) };
  const { id } = await ctx.params;
  const targetId = Number(id);
  if (!Number.isInteger(targetId) || !getUserById(targetId)) {
    return { error: NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 }) };
  }
  if (targetId === user.id) {
    return { error: NextResponse.json({ error: "O'zingizni bloklab bo'lmaydi" }, { status: 400 }) };
  }
  return { userId: user.id, targetId };
}

export async function POST(_request: Request, ctx: RouteContext<"/api/users/[id]/block">) {
  const t = await target(ctx);
  if ("error" in t) return t.error;
  blockUserFor(t.userId, t.targetId);
  return NextResponse.json({ blocked: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/users/[id]/block">) {
  const t = await target(ctx);
  if ("error" in t) return t.error;
  unblockUserFor(t.userId, t.targetId);
  return NextResponse.json({ blocked: false });
}
