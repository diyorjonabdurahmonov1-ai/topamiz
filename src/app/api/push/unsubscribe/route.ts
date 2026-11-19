import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { getCurrentUser } from "@/lib/auth";
import { removeSubscription } from "@/lib/push";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) return await apiError("invalidRequest", 400);

  removeSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
