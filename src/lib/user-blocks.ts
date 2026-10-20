import { db } from "./db";

// A user blocking another user (an admin blocking someone site-wide is
// admin-users.ts). The blocker no longer sees the other's listings,
// comments, chats or notifications, and no message goes either way; the
// friendship, if any, ends. Unblocking undoes all of it except the
// friendship.

export function blockUserFor(blockerId: number, blockedId: number): void {
  if (blockerId === blockedId) return;
  db.transaction(() => {
    db.prepare("INSERT OR IGNORE INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)").run(blockerId, blockedId);
    db.prepare(
      "DELETE FROM friendships WHERE (follower_id = ? AND followed_id = ?) OR (follower_id = ? AND followed_id = ?)"
    ).run(blockerId, blockedId, blockedId, blockerId);
  })();
}

export function unblockUserFor(blockerId: number, blockedId: number): void {
  db.prepare("DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?").run(blockerId, blockedId);
}

export function hasBlocked(blockerId: number, blockedId: number): boolean {
  return !!db.prepare("SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?").get(blockerId, blockedId);
}

// Either one blocked the other: they can't message each other.
export function isBlockedBetween(a: number, b: number): boolean {
  return hasBlocked(a, b) || hasBlocked(b, a);
}

export function blockedIdsFor(blockerId: number | null | undefined): Set<number> {
  if (!blockerId) return new Set();
  const rows = db.prepare("SELECT blocked_id FROM user_blocks WHERE blocker_id = ?").all(blockerId) as {
    blocked_id: number;
  }[];
  return new Set(rows.map((r) => r.blocked_id));
}

export function withoutBlockedOwners<T extends { ownerId: number | null }>(
  listings: T[],
  viewerId: number | null | undefined
): T[] {
  const blocked = blockedIdsFor(viewerId);
  return blocked.size === 0 ? listings : listings.filter((l) => !l.ownerId || !blocked.has(l.ownerId));
}

export const MAX_USER_REPORT_LENGTH = 500;

export function reportUser(params: {
  reportedId: number;
  reporterId: number;
  reason: string;
  context: "profile" | "chat";
}): boolean {
  if (params.reportedId === params.reporterId) return false;
  // One report per person per user; reporting again updates the reason.
  db.prepare(
    `INSERT INTO user_reports (reported_id, reporter_id, reason, context) VALUES (?, ?, ?, ?)
     ON CONFLICT (reported_id, reporter_id) DO UPDATE SET reason = excluded.reason, context = excluded.context, created_at = datetime('now')`
  ).run(params.reportedId, params.reporterId, params.reason, params.context);
  return true;
}

export interface ReportedUserSummary {
  userId: number;
  name: string;
  reportCount: number;
  reasons: { text: string; context: string; createdAt: string }[];
  blockedAt: string | null;
}

export function getReportedUsers(): ReportedUserSummary[] {
  const rows = db
    .prepare(
      `SELECT r.reported_id, u.name, u.blocked_at, r.reason, r.context, r.created_at
       FROM user_reports r JOIN users u ON u.id = r.reported_id
       ORDER BY r.created_at DESC`
    )
    .all() as {
    reported_id: number;
    name: string;
    blocked_at: string | null;
    reason: string;
    context: string;
    created_at: string;
  }[];
  const byUser = new Map<number, ReportedUserSummary>();
  for (const row of rows) {
    const entry = byUser.get(row.reported_id) ?? {
      userId: row.reported_id,
      name: row.name,
      reportCount: 0,
      reasons: [],
      blockedAt: row.blocked_at,
    };
    entry.reportCount++;
    entry.reasons.push({ text: row.reason, context: row.context, createdAt: row.created_at });
    byUser.set(row.reported_id, entry);
  }
  return [...byUser.values()].sort((a, b) => b.reportCount - a.reportCount);
}

export function dismissUserReports(userId: number): void {
  db.prepare("DELETE FROM user_reports WHERE reported_id = ?").run(userId);
}
