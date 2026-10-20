import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { dismissUserReports } from "@/lib/user-blocks";

// Closes every report about this user (looked into, nothing to do).
export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/user-reports/[id]">) {
  const admin = await getCurrentUser();
  if (!admin || !isAdmin(admin)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await ctx.params;
  dismissUserReports(Number(id));
  return NextResponse.json({ ok: true });
}
