import type { Listing } from "./types";

const STOPWORDS = new Set([
  "va", "bilan", "uchun", "bu", "yoki", "ham", "edi", "bor", "yo'q",
  "men", "biz", "u", "ular", "juda", "keyin", "bo'lishi", "mumkin",
  "topildi", "yo'qoldi", "topilgan", "yo'qolgan",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function smartSearch(query: string, pool: Listing[]): Listing[] {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return pool;

  return pool
    .map((listing) => {
      const listingTokens = new Set([...tokenize(listing.title), ...tokenize(listing.description)]);
      const overlapCount = [...queryTokens].filter((t) => listingTokens.has(t)).length;
      const cityOrCategoryHit =
        tokenize(listing.city).some((t) => queryTokens.has(t)) || queryTokens.has(listing.category);
      const score = overlapCount * 2 + (cityOrCategoryHit ? 1 : 0);
      return { listing, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.listing);
}
