import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getListingById } from "@/lib/listings";
import { toggleLike } from "@/lib/listing-likes";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request, ctx: RouteContext<"/api/listings/[id]/like">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const ip = getClientIp(request);
  const limit = rateLimit(`listing-like:${ip}`, 60, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const { id } = await ctx.params;
  const listing = getListingById(id);
  if (!listing) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const result = toggleLike(Number(id), user.id);
  return NextResponse.json(result);
}
