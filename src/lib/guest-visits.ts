import { db } from "./db";

export const GUEST_COOKIE = "findo_guest";

// Called from proxy.ts for every request that has no session cookie — counts
// how many distinct browsers have used the site without ever registering.
// Throttled the same way getCurrentUser() throttles last_seen_at, so a guest
// clicking around doesn't turn into a write on every single request.
export function recordGuestVisit(guestId: string): void {
  db.prepare(
    `INSERT INTO guest_visits (guest_id, first_seen_at, last_seen_at, visit_count)
     VALUES (?, datetime('now'), datetime('now'), 1)
     ON CONFLICT(guest_id) DO UPDATE SET
       last_seen_at = datetime('now'),
       visit_count = visit_count + 1
     WHERE last_seen_at < datetime('now', '-1 minutes')`
  ).run(guestId);
}

export function countGuestVisitors(): number {
  return (db.prepare("SELECT COUNT(*) as c FROM guest_visits").get() as { c: number }).c;
}

export interface GuestVisitRow {
  guestId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
}

export function getAllGuestVisits(): GuestVisitRow[] {
  const rows = db
    .prepare("SELECT * FROM guest_visits ORDER BY last_seen_at DESC")
    .all() as { guest_id: string; first_seen_at: string; last_seen_at: string; visit_count: number }[];
  return rows.map((row) => ({
    guestId: row.guest_id,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    visitCount: row.visit_count,
  }));
}
