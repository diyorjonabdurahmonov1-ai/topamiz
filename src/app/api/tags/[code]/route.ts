import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteTag } from "@/lib/tags";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/tags/[code]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { code } = await ctx.params;
  const ok = deleteTag(code, user.id);
  if (!ok) return NextResponse.json({ error: "Belgi topilmadi" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
