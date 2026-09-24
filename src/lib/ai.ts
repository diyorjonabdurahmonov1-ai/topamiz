import type { Listing } from "./types";

// On-device heuristic matcher: no external AI key is configured in this project,
// so matching runs locally. Swap `scorePair` for an embeddings/LLM API call later
// without touching any call site below.
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

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export type MatchReasonKey = "sameCategory" | "sameCity" | "similarKeywords" | "closeDates";

export interface MatchResult {
  listing: Listing;
  score: number;
  reasons: MatchReasonKey[];
}

export function scorePair(a: Listing, b: Listing): { score: number; reasons: MatchReasonKey[] } {
  const reasons: MatchReasonKey[] = [];
  let score = 0;

  if (a.category === b.category) {
    score += 0.35;
    reasons.push("sameCategory");
  }
  if (a.city === b.city) {
    score += 0.25;
    reasons.push("sameCity");
  }

  const tokensA = new Set([...tokenize(a.title), ...tokenize(a.description)]);
  const tokensB = new Set([...tokenize(b.title), ...tokenize(b.description)]);
  const textScore = jaccard(tokensA, tokensB);
  score += textScore * 0.4;
  if (textScore > 0.08) reasons.push("similarKeywords");

  const daysApart = Math.abs(
    (new Date(a.date).getTime() - new Date(b.date).getTime()) / 86_400_000
  );
  if (daysApart <= 5) {
    score += 0.1 * (1 - daysApart / 5);
    reasons.push("closeDates");
  }

  return { score: Math.min(1, score), reasons };
}

export function findMatches(target: Listing, pool: Listing[], limit = 4): MatchResult[] {
  const oppositeKind = target.kind === "lost" ? "found" : "lost";
  return pool
    .filter((l) => l.id !== target.id && l.kind === oppositeKind && l.status === "active")
    .map((listing) => {
      const { score, reasons } = scorePair(target, listing);
      return { listing, score, reasons };
    })
    .filter((m) => m.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
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
