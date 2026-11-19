import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { blockUserFor, unblockUserFor } from "@/lib/user-blocks";

async function target(ctx: RouteContext<"/api/users/[id]/block">) {
  const user = await getCurrentUser();
  if (!user) return { error: await apiError("signInRequired", 401) };
  const { id } = await ctx.params;
  const targetId = Number(id);
  if (!Number.isInteger(targetId) || !getUserById(targetId)) {
    return { error: await apiError("userNotFound", 404) };
  }
  if (targetId === user.id) {
    return { error: await apiError("cannotBlockSelf", 400) };
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
