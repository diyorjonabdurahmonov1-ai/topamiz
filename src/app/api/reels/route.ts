import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getVideoListings } from "@/lib/listings";
import { getLikedListingIds } from "@/lib/listing-likes";
import { countryForIp } from "@/lib/geo";
import { getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const excludeIds = (searchParams.get("exclude") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));

  const ip = getClientIp(request);
  const listings = getVideoListings(countryForIp(ip), excludeIds);

  const user = await getCurrentUser();
  const likedIds = user ? getLikedListingIds(user.id, listings.map((l) => Number(l.id))) : new Set<number>();
  const withLiked = listings.map((l) => ({ ...l, likedByMe: likedIds.has(Number(l.id)) }));

  return NextResponse.json({ listings: withLiked });
}
