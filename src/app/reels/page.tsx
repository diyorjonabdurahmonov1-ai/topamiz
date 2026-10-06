import type { Metadata } from "next";
import { getReelsListings } from "@/lib/listings";
import { getLikedListingIds } from "@/lib/listing-likes";
import { getCurrentUser } from "@/lib/auth";
import { getVisitorCountry } from "@/lib/geo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import ReelsFeed from "@/components/ReelsFeed";

export const metadata: Metadata = {
  title: "Video — Findo",
};

export default async function ReelsPage() {
  const country = await getVisitorCountry();
  const user = await getCurrentUser();
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const listings = getReelsListings(country, [], !!user);
  const likedIds = user ? getLikedListingIds(user.id, listings.map((l) => Number(l.id))) : new Set<number>();
  const initialListings = listings.map((l) => ({ ...l, likedByMe: likedIds.has(Number(l.id)) }));

  return <ReelsFeed initialListings={initialListings} loggedIn={!!user} dict={dict} />;
}
