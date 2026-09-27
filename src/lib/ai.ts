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

// Classic edit-distance DP, single row reused for O(min(len)) memory.
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const row = new Array(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, row[j], row[j - 1]);
      prev = temp;
    }
  }
  return row[n];
}

// How many typos/spelling variants a word this long can tolerate before it
// stops being a fair match — kept tight for short words so unrelated
// 3-letter words don't accidentally collide.
function fuzzyThreshold(length: number): number {
  if (length <= 3) return 0;
  if (length <= 6) return 1;
  return 2;
}

// Scores how well a single query word matches a single listing word —
// exact match scores highest, one word containing the other next (handles
// plurals/suffixes like "telefon" vs "telefonlar"), and a small edit
// distance last (handles common misspellings/spelling variants, e.g.
// Uzbek "telefon" vs the equally common "telifon").
function wordMatchScore(query: string, target: string): number {
  if (query === target) return 2;
  if (target.includes(query) || query.includes(target)) return 1.5;
  const threshold = fuzzyThreshold(Math.min(query.length, target.length));
  if (threshold > 0 && levenshtein(query, target) <= threshold) return 1;
  return 0;
}

export function smartSearch(query: string, pool: Listing[]): Listing[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return pool;

  return pool
    .map((listing) => {
      const listingWords = [
        ...tokenize(listing.title),
        ...tokenize(listing.description),
        ...tokenize(listing.city),
        listing.category,
      ];

      let score = 0;
      for (const queryWord of queryTokens) {
        let best = 0;
        for (const listingWord of listingWords) {
          const match = wordMatchScore(queryWord, listingWord);
          if (match > best) best = match;
        }
        score += best;
      }
      return { listing, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.listing);
}
