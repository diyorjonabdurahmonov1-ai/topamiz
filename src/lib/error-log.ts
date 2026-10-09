import crypto from "node:crypto";
import { db } from "./db";

// One place for everything that went wrong: crashes in visitors' browsers
// (reported by components/ErrorReporter.tsx), server errors (Next's
// onRequestError in src/instrumentation.ts) and failed video uploads.
// Identical errors are grouped by a fingerprint so a bug hitting a thousand
// phones is one row with a count, not a thousand rows.

export type ErrorKind = "client" | "server" | "video-upload";

const MAX_MESSAGE = 500;
const MAX_DETAIL = 4000;
const KEEP_DAYS = 30;
const MAX_ROWS = 20000;

// Numbers, hex ids and quoted values vary between occurrences of the same
// bug ("chunk 4817 failed", "listing 12 not found") — blank them out so
// those still group together.
export function fingerprintFor(kind: ErrorKind, message: string, source = ""): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/"[^"]*"|'[^']*'/g, '""')
      .replace(/\b[0-9a-f]{8,}\b/g, "#")
      .replace(/\d+/g, "#")
      .trim();
  return crypto.createHash("sha1").update(`${kind}|${normalize(message)}|${normalize(source)}`).digest("hex").slice(0, 16);
}

// Paths only — query strings can carry search terms and tokens.
export function cleanPath(raw: string): string {
  try {
    return new URL(raw, "http://x").pathname.slice(0, 300);
  } catch {
    return "";
  }
}

let insertsSincePrune = 0;

export function recordError(entry: {
  kind: ErrorKind;
  message: string;
  // The first stack frame or the route — what tells two bugs with the same
  // message apart.
  source?: string;
  detail?: string;
  path?: string;
  userAgent?: string;
  userId?: number | null;
}) {
  const message = (entry.message || "Noma'lum xato").slice(0, MAX_MESSAGE);
  db.prepare(
    `INSERT INTO app_errors (kind, fingerprint, message, detail, path, user_agent, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    entry.kind,
    fingerprintFor(entry.kind, message, entry.source),
    message,
    (entry.detail ?? "").slice(0, MAX_DETAIL),
    cleanPath(entry.path ?? ""),
    (entry.userAgent ?? "").slice(0, 300),
    entry.userId ?? null
  );
  if (++insertsSincePrune >= 100) {
    insertsSincePrune = 0;
    pruneErrors();
  }
}

export function pruneErrors() {
  db.prepare("DELETE FROM app_errors WHERE created_at < datetime('now', ?)").run(`-${KEEP_DAYS} days`);
  db.prepare(
    "DELETE FROM app_errors WHERE id <= (SELECT id FROM app_errors ORDER BY id DESC LIMIT 1 OFFSET ?)"
  ).run(MAX_ROWS);
}

export interface ErrorGroup {
  fingerprint: string;
  kind: ErrorKind;
  message: string;
  count: number;
  users: number;
  firstSeen: string;
  lastSeen: string;
  // From the most recent occurrence.
  detail: string;
  path: string;
  userAgent: string;
  paths: string[];
}

export function getErrorGroups(limit = 100): ErrorGroup[] {
  const rows = db
    .prepare(
      `SELECT g.fingerprint, g.count, g.users, g.first_seen, g.last_seen, g.paths,
              e.kind, e.message, e.detail, e.path, e.user_agent
       FROM (
         SELECT fingerprint, COUNT(*) AS count, COUNT(DISTINCT COALESCE(user_id, user_agent)) AS users,
                MIN(created_at) AS first_seen, MAX(created_at) AS last_seen, MAX(id) AS last_id,
                GROUP_CONCAT(DISTINCT path) AS paths
         FROM app_errors GROUP BY fingerprint
       ) g JOIN app_errors e ON e.id = g.last_id
       ORDER BY g.last_seen DESC LIMIT ?`
    )
    .all(limit) as {
    fingerprint: string;
    count: number;
    users: number;
    first_seen: string;
    last_seen: string;
    paths: string | null;
    kind: ErrorKind;
    message: string;
    detail: string;
    path: string;
    user_agent: string;
  }[];
  return rows.map((r) => ({
    fingerprint: r.fingerprint,
    kind: r.kind,
    message: r.message,
    count: r.count,
    users: r.users,
    firstSeen: r.first_seen,
    lastSeen: r.last_seen,
    detail: r.detail,
    path: r.path,
    userAgent: r.user_agent,
    paths: (r.paths ?? "").split(",").filter(Boolean).slice(0, 5),
  }));
}

// Distinct problems seen in the last 24 hours — the admin nav badge.
export function countRecentErrorGroups(): number {
  return (
    db
      .prepare("SELECT COUNT(DISTINCT fingerprint) AS c FROM app_errors WHERE created_at >= datetime('now', '-1 day')")
      .get() as { c: number }
  ).c;
}

// "Fixed": forget a group. If the bug isn't actually fixed, it comes back
// as soon as it happens again.
export function deleteErrorGroup(fingerprint: string): boolean {
  return db.prepare("DELETE FROM app_errors WHERE fingerprint = ?").run(fingerprint).changes > 0;
}

export function deleteAllErrors() {
  db.prepare("DELETE FROM app_errors").run();
}
