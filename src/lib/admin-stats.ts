import { db } from "./db";

// Activity over time for the admin dashboard. Timestamps are stored in UTC
// (SQLite's datetime('now')); "today" and the daily buckets are Tashkent
// days (UTC+5, no daylight saving), which is what the owner means by today.
const LOCAL = "'+5 hours'";

type Table = "users" | "listings" | "messages";

function countSince(table: Table, days: number): number {
  // days = 0 → today only; 6 → today and the six days before it.
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM ${table}
       WHERE date(created_at, ${LOCAL}) >= date('now', ${LOCAL}, ?)`
    )
    .get(`-${days} days`) as { c: number };
  return row.c;
}

export interface ActivityCount {
  today: number;
  week: number;
}

export interface DailyPoint {
  day: string; // YYYY-MM-DD, Tashkent time
  users: number;
  listings: number;
}

export function getActivity(): Record<Table, ActivityCount> & { resolved: number; resolvedWeek: number } {
  const counts = Object.fromEntries(
    (["users", "listings", "messages"] as const).map((t) => [t, { today: countSince(t, 0), week: countSince(t, 6) }])
  ) as Record<Table, ActivityCount>;
  const resolved = (db.prepare("SELECT COUNT(*) AS c FROM listings WHERE status = 'resolved'").get() as { c: number }).c;
  // No resolved_at column — a listing marked found within the last week is
  // approximated by one created within it that's already resolved.
  const resolvedWeek = (
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM listings WHERE status = 'resolved'
         AND date(created_at, ${LOCAL}) >= date('now', ${LOCAL}, '-6 days')`
      )
      .get() as { c: number }
  ).c;
  return { ...counts, resolved, resolvedWeek };
}

// New users and listings per day for the last 7 days, oldest first,
// including days with nothing (so the chart has no gaps).
export function getDailyActivity(): DailyPoint[] {
  const perDay = (table: Table) =>
    new Map(
      (
        db
          .prepare(
            `SELECT date(created_at, ${LOCAL}) AS day, COUNT(*) AS c FROM ${table}
             WHERE date(created_at, ${LOCAL}) >= date('now', ${LOCAL}, '-6 days')
             GROUP BY day`
          )
          .all() as { day: string; c: number }[]
      ).map((r) => [r.day, r.c])
    );
  const users = perDay("users");
  const listings = perDay("listings");
  const today = (db.prepare(`SELECT date('now', ${LOCAL}) AS d`).get() as { d: string }).d;
  const points: DailyPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.toISOString().slice(0, 10);
    points.push({ day, users: users.get(day) ?? 0, listings: listings.get(day) ?? 0 });
  }
  return points;
}
