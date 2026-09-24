import { db } from "./db";

// A user counts as "online" if we've seen a request from them (see
// getCurrentUser's last_seen_at touch) within this window.
const ONLINE_WINDOW_MINUTES = 5;

interface RawUserRow {
  id: number;
  email: string | null;
  phone: string | null;
  name: string;
  avatar_color: string;
  avatar_url: string | null;
  last_seen_at: string | null;
  blocked_at: string | null;
  created_at: string;
}

export interface AdminUserRow {
  id: number;
  email: string;
  name: string;
  avatarColor: string;
  avatarUrl: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  blockedAt: string | null;
  online: boolean;
}

function onlineCutoff(): string {
  return (
    db.prepare("SELECT datetime('now', ?) as cutoff").get(`-${ONLINE_WINDOW_MINUTES} minutes`) as {
      cutoff: string;
    }
  ).cutoff;
}

function toAdminUser(row: RawUserRow, cutoff: string): AdminUserRow {
  return {
    id: row.id,
    email: row.email ?? row.phone ?? "",
    name: row.name,
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    blockedAt: row.blocked_at,
    online: !!row.last_seen_at && row.last_seen_at > cutoff,
  };
}

export function listUsers(query = ""): AdminUserRow[] {
  const cutoff = onlineCutoff();
  const trimmed = query.trim();
  // created_at has only second-level resolution, so tie-break on id (which
  // strictly increases with insertion order) to keep the listing stable.
  const rows = trimmed
    ? (db
        .prepare(
          `SELECT * FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY created_at DESC, id DESC`
        )
        .all(`%${trimmed}%`, `%${trimmed}%`) as RawUserRow[])
    : (db.prepare(`SELECT * FROM users ORDER BY created_at DESC, id DESC`).all() as RawUserRow[]);
  return rows.map((row) => toAdminUser(row, cutoff));
}

export function countUsers(): number {
  return (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
}

export function countOnlineUsers(): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM users WHERE last_seen_at IS NOT NULL AND last_seen_at > ?`
    )
    .get(onlineCutoff()) as { c: number };
  return row.c;
}

export function countBlockedUsers(): number {
  return (
    db.prepare("SELECT COUNT(*) as c FROM users WHERE blocked_at IS NOT NULL").get() as {
      c: number;
    }
  ).c;
}

export function blockUser(id: number): boolean {
  const info = db
    .prepare("UPDATE users SET blocked_at = datetime('now') WHERE id = ? AND blocked_at IS NULL")
    .run(id);
  if (info.changes > 0) {
    // Log them out everywhere immediately instead of waiting for their
    // session to naturally expire or for getCurrentUser to next catch it.
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  }
  return info.changes > 0;
}

export function unblockUser(id: number): boolean {
  const info = db.prepare("UPDATE users SET blocked_at = NULL WHERE id = ?").run(id);
  return info.changes > 0;
}
