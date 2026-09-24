import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteTag, setTagStatus } from "@/lib/tags";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/tags/[code]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { code } = await ctx.params;
  const ok = deleteTag(code, user.id);
  if (!ok) return NextResponse.json({ error: "Belgi topilmadi" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/tags/[code]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { code } = await ctx.params;
  const body = await request.json().catch(() => null);
  const status = body?.status === "active" || body?.status === "resolved" ? body.status : null;
  if (!status) return NextResponse.json({ error: "Noto'g'ri holat" }, { status: 400 });

  const ok = setTagStatus(code, user.id, status);
  if (!ok) return NextResponse.json({ error: "Belgi topilmadi" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
