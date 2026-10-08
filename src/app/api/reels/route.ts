import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getReelsListings } from "@/lib/listings";
import { getLikedListingIds } from "@/lib/listing-likes";
import { countryForIp } from "@/lib/geo";
import { getClientIp } from "@/lib/rate-limit";

// Each id becomes one SQL parameter; past a few hundred, repeats in the
// feed are fine, and an unbounded list could hit SQLite's parameter limit.
const MAX_EXCLUDE = 500;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const excludeIds = (searchParams.get("exclude") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .slice(-MAX_EXCLUDE);

  const user = await getCurrentUser();
  const ip = getClientIp(request);
  // Sirli quti stays out of a guest's Reels feed the same way it's gated
  // everywhere else on the site — a logged-in viewer gets it mixed in.
  const listings = getReelsListings(countryForIp(ip), excludeIds, !!user);

  const likedIds = user ? getLikedListingIds(user.id, listings.map((l) => Number(l.id))) : new Set<number>();
  const withLiked = listings.map((l) => ({ ...l, likedByMe: likedIds.has(Number(l.id)) }));

  return NextResponse.json({ listings: withLiked });
}
