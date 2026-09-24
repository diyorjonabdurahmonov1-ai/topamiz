import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getListingById } from "@/lib/listings";
import { MAX_REPORT_REASON_LENGTH, reportListing } from "@/lib/listing-reports";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request, ctx: RouteContext<"/api/elonlar/[id]/report">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Shikoyat qilish uchun tizimga kiring" }, { status: 401 });

  const ip = getClientIp(request);
  const limit = rateLimit(`listing-report:${user.id}:${ip}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const { id } = await ctx.params;
  const listing = getListingById(id);
  if (!listing) return NextResponse.json({ error: "E'lon topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const reason =
    typeof body?.reason === "string" ? body.reason.trim().slice(0, MAX_REPORT_REASON_LENGTH) : "";

  const result = reportListing(id, user.id, reason);
  return NextResponse.json(result);
}
