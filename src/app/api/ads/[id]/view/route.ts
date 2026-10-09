import { NextResponse } from "next/server";
import { recordAdView } from "@/lib/ads";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Called by the home banner when an ad has actually been on screen. Counted
// at most once per visitor per ad every 30 minutes, so the carousel rotating
// back to the same ad doesn't count it again.
export async function POST(request: Request, ctx: RouteContext<"/api/ads/[id]/view">) {
  const { id } = await ctx.params;
  const adId = Number(id);
  if (!Number.isInteger(adId)) return NextResponse.json({ ok: false }, { status: 400 });
  if (rateLimit(`ad-view:${getClientIp(request)}:${adId}`, 1, 30 * 60 * 1000).allowed) recordAdView(adId);
  return NextResponse.json({ ok: true });
}
