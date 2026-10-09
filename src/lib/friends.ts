import { db } from "./db";
import { getPublicUserById, type PublicUser } from "./auth";

export function isFriend(followerId: number, followedId: number): boolean {
  const row = db
    .prepare("SELECT 1 FROM friendships WHERE follower_id = ? AND followed_id = ?")
    .get(followerId, followedId);
  return !!row;
}

export function addFriend(followerId: number, followedId: number): void {
  if (followerId === followedId) return;
  db.prepare("INSERT OR IGNORE INTO friendships (follower_id, followed_id) VALUES (?, ?)").run(
    followerId,
    followedId
  );
}

export function removeFriend(followerId: number, followedId: number): void {
  db.prepare("DELETE FROM friendships WHERE follower_id = ? AND followed_id = ?").run(
    followerId,
    followedId
  );
}

export function getFriendCount(userId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) as c FROM friendships WHERE follower_id = ?")
    .get(userId) as { c: number };
  return row.c;
}

// How many people have added `userId` as a friend (their "followers").
export function getFollowerCount(userId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) as c FROM friendships WHERE followed_id = ?")
    .get(userId) as { c: number };
  return row.c;
}

// The people who have added `userId`, newest first.
export function getFollowers(userId: number): PublicUser[] {
  const rows = db
    .prepare("SELECT follower_id FROM friendships WHERE followed_id = ? ORDER BY created_at DESC")
    .all(userId) as { follower_id: number }[];
  return rows.map((r) => getPublicUserById(r.follower_id)).filter((u): u is PublicUser => !!u);
}

// Everyone `userId` has added, for marking list rows they've already added.
export function getFriendIdSet(userId: number): Set<number> {
  const rows = db.prepare("SELECT followed_id FROM friendships WHERE follower_id = ?").all(userId) as {
    followed_id: number;
  }[];
  return new Set(rows.map((r) => r.followed_id));
}

// The people `userId` has added as friends — shown on their profile's
// friends list.
export function getFriends(userId: number): PublicUser[] {
  const rows = db
    .prepare("SELECT followed_id FROM friendships WHERE follower_id = ? ORDER BY created_at DESC")
    .all(userId) as { followed_id: number }[];
  return rows.map((r) => getPublicUserById(r.followed_id)).filter((u): u is PublicUser => !!u);
}

// The people who have added `userId` as a friend — used to notify them
// when this user posts a new listing.
export function getFollowerIds(userId: number): number[] {
  const rows = db
    .prepare("SELECT follower_id FROM friendships WHERE followed_id = ?")
    .all(userId) as { follower_id: number }[];
  return rows.map((r) => r.follower_id);
}
