import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { getCurrentUser } from "@/lib/auth";
import { deleteTag, setTagStatus } from "@/lib/tags";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/tags/[code]">) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  const { code } = await ctx.params;
  const ok = deleteTag(code, user.id);
  if (!ok) return await apiError("tagNotFound", 404);

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/tags/[code]">) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  const { code } = await ctx.params;
  const body = await request.json().catch(() => null);
  const status = body?.status === "active" || body?.status === "resolved" ? body.status : null;
  if (!status) return await apiError("invalidStatus", 400);

  const ok = setTagStatus(code, user.id, status);
  if (!ok) return await apiError("tagNotFound", 404);

  return NextResponse.json({ ok: true });
}
