import { NextResponse } from "next/server";
import { getAdById, recordAdClick } from "@/lib/ads";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Banner links go through here so clicks can be counted. The target is the
// ad's own stored link — never a URL from the request — so this can't be
// used as an open redirect.
export async function GET(request: Request, ctx: RouteContext<"/api/ads/[id]/click">) {
  const { id } = await ctx.params;
  const ad = getAdById(Number(id));
  if (!ad || !ad.linkUrl) return NextResponse.redirect(new URL("/", request.url));
  // One click per visitor per ad per minute — double taps and refreshes
  // shouldn't inflate the count.
  if (rateLimit(`ad-click:${getClientIp(request)}:${ad.id}`, 1, 60 * 1000).allowed) recordAdClick(ad.id);
  return NextResponse.redirect(ad.linkUrl);
}
