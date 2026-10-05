import { db } from "./db";
import { displayIdentity, getUserById } from "./auth";

export const MAX_COMMENT_LENGTH = 500;

export interface ListingComment {
  id: number;
  listingId: number;
  userId: number;
  userName: string;
  userAvatarColor: string;
  userAvatarUrl: string | null;
  body: string;
  createdAt: string;
}

interface RawCommentRow {
  id: number;
  listing_id: number;
  user_id: number;
  body: string;
  created_at: string;
}

export function getCommentCount(listingId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) as c FROM listing_comments WHERE listing_id = ?")
    .get(listingId) as { c: number };
  return row.c;
}

export function getComments(listingId: number): ListingComment[] {
  const rows = db
    .prepare("SELECT * FROM listing_comments WHERE listing_id = ? ORDER BY created_at ASC, id ASC")
    .all(listingId) as RawCommentRow[];
  return rows
    .map((row) => {
      const user = getUserById(row.user_id);
      if (!user) return null;
      const identity = displayIdentity(user);
      return {
        id: row.id,
        listingId: row.listing_id,
        userId: row.user_id,
        userName: identity.name,
        userAvatarColor: identity.avatarColor,
        userAvatarUrl: identity.avatarUrl,
        body: row.body,
        createdAt: row.created_at,
      };
    })
    .filter((c): c is ListingComment => !!c);
}

export function addComment(params: { listingId: number; userId: number; body: string }): ListingComment {
  const info = db
    .prepare("INSERT INTO listing_comments (listing_id, user_id, body) VALUES (?, ?, ?)")
    .run(params.listingId, params.userId, params.body);
  const row = db
    .prepare("SELECT * FROM listing_comments WHERE id = ?")
    .get(info.lastInsertRowid) as RawCommentRow;
  const user = getUserById(params.userId);
  const identity = user ? displayIdentity(user) : { name: "", avatarColor: "#6366f1", avatarUrl: null };
  return {
    id: row.id,
    listingId: row.listing_id,
    userId: row.user_id,
    userName: identity.name,
    userAvatarColor: identity.avatarColor,
    userAvatarUrl: identity.avatarUrl,
    body: row.body,
    createdAt: row.created_at,
  };
}
