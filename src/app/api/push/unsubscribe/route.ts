import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { removeSubscription } from "@/lib/push";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  removeSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
