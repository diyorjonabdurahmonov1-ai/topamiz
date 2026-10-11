import { ALL_CATEGORIES } from "./sections";
import type { CategoryId, Listing } from "./types";

// The map's filter chips. Every listing falls in exactly one section, so the
// counts on the chips add up and a pin never shows under two of them: lost
// and found, renting, businesses' offers and mystery boxes each have their
// own, and everything else (sales, jobs, services) goes by category.
export type MapSection = "lost" | "found" | "rent" | "promo" | "mystery" | `cat:${CategoryId}`;

export function mapSectionOf(listing: Pick<Listing, "kind" | "category" | "isPromo" | "isMysteryBox">): MapSection {
  if (listing.isMysteryBox) return "mystery";
  if (listing.isPromo) return "promo";
  if (listing.kind === "lost" || listing.kind === "found" || listing.kind === "rent") return listing.kind;
  return `cat:${listing.category}`;
}

// Same order as the home page's section row: lost & found first, renting
// next to property, offers and mystery boxes last.
const ORDER: MapSection[] = [
  "lost",
  "found",
  ...ALL_CATEGORIES.flatMap((c): MapSection[] => (c === "kochmas_mulk" ? [`cat:${c}`, "rent"] : [`cat:${c}`])),
  "promo",
  "mystery",
];

// The sections present among these listings, in display order, with how
// many pins each has.
export function mapSections(
  listings: Pick<Listing, "kind" | "category" | "isPromo" | "isMysteryBox">[]
): { section: MapSection; count: number }[] {
  const counts = new Map<MapSection, number>();
  for (const l of listings) {
    const s = mapSectionOf(l);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return ORDER.filter((s) => counts.has(s)).map((section) => ({ section, count: counts.get(section)! }));
}
