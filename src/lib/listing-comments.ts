import { db } from "./db";
import { blockedIdsFor } from "./user-blocks";
import { displayIdentity, getUserById, isUserBlocked } from "./auth";

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
  // The top-level comment this one is a reply under (null for a top-level
  // comment), and the name of the person it answers.
  parentId: number | null;
  replyToName: string | null;
}

interface RawCommentRow {
  id: number;
  listing_id: number;
  user_id: number;
  body: string;
  created_at: string;
  parent_id: number | null;
  reply_to_user_id: number | null;
}

export function getCommentCount(listingId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) as c FROM listing_comments WHERE listing_id = ?")
    .get(listingId) as { c: number };
  return row.c;
}

export function getCommentRow(id: number): RawCommentRow | null {
  return (db.prepare("SELECT * FROM listing_comments WHERE id = ?").get(id) as RawCommentRow | undefined) ?? null;
}

function toComment(row: RawCommentRow): ListingComment | null {
  const user = getUserById(row.user_id);
  if (!user || isUserBlocked(row.user_id)) return null;
  const identity = displayIdentity(user);
  const replyTo = row.reply_to_user_id ? getUserById(row.reply_to_user_id) : null;
  return {
    id: row.id,
    listingId: row.listing_id,
    userId: row.user_id,
    userName: identity.name,
    userAvatarColor: identity.avatarColor,
    userAvatarUrl: identity.avatarUrl,
    body: row.body,
    createdAt: row.created_at,
    parentId: row.parent_id,
    replyToName: replyTo ? displayIdentity(replyTo).name : null,
  };
}

// `viewerId`: comments by anyone the viewer blocked are left out.
export function getComments(listingId: number, viewerId?: number | null): ListingComment[] {
  const rows = db
    .prepare("SELECT * FROM listing_comments WHERE listing_id = ? ORDER BY created_at ASC, id ASC")
    .all(listingId) as RawCommentRow[];
  const blocked = blockedIdsFor(viewerId);
  const comments = rows.map((row) => (blocked.has(row.user_id) ? null : toComment(row))).filter((c): c is ListingComment => !!c);
  // A reply whose parent is hidden (blocked author) would hang in the air.
  const shown = new Set(comments.map((c) => c.id));
  return comments.filter((c) => c.parentId === null || shown.has(c.parentId));
}

export function addComment(params: {
  listingId: number;
  userId: number;
  body: string;
  parentId?: number | null;
  replyToUserId?: number | null;
}): ListingComment {
  const info = db
    .prepare(
      "INSERT INTO listing_comments (listing_id, user_id, body, parent_id, reply_to_user_id) VALUES (?, ?, ?, ?, ?)"
    )
    .run(params.listingId, params.userId, params.body, params.parentId ?? null, params.replyToUserId ?? null);
  const row = getCommentRow(Number(info.lastInsertRowid)) as RawCommentRow;
  return (
    toComment(row) ?? {
      id: row.id,
      listingId: row.listing_id,
      userId: row.user_id,
      userName: "",
      userAvatarColor: "#6366f1",
      userAvatarUrl: null,
      body: row.body,
      createdAt: row.created_at,
      parentId: row.parent_id,
      replyToName: null,
    }
  );
}
