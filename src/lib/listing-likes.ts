import { db } from "./db";

export function getLikeCount(listingId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) as c FROM listing_likes WHERE listing_id = ?")
    .get(listingId) as { c: number };
  return row.c;
}

export function isLikedByUser(listingId: number, userId: number): boolean {
  return !!db
    .prepare("SELECT 1 FROM listing_likes WHERE listing_id = ? AND user_id = ?")
    .get(listingId, userId);
}

// Bulk version for a feed of listings (Reels), where checking one row at a
// time per card would be a query per card instead of one for the page.
export function getLikedListingIds(userId: number, listingIds: number[]): Set<number> {
  if (listingIds.length === 0) return new Set();
  const placeholders = listingIds.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT listing_id FROM listing_likes WHERE user_id = ? AND listing_id IN (${placeholders})`)
    .all(userId, ...listingIds) as { listing_id: number }[];
  return new Set(rows.map((r) => r.listing_id));
}

// Toggles the current user's like and returns the resulting state — the
// caller never has to separately check "am I liking or unliking?" first.
export function toggleLike(listingId: number, userId: number): { liked: boolean; count: number } {
  const existing = db
    .prepare("SELECT 1 FROM listing_likes WHERE listing_id = ? AND user_id = ?")
    .get(listingId, userId);
  if (existing) {
    db.prepare("DELETE FROM listing_likes WHERE listing_id = ? AND user_id = ?").run(listingId, userId);
  } else {
    db.prepare("INSERT INTO listing_likes (listing_id, user_id) VALUES (?, ?)").run(listingId, userId);
  }
  return { liked: !existing, count: getLikeCount(listingId) };
}
