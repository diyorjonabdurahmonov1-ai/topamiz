import { db } from "./db";
import { deleteListing } from "./listings";

export const MAX_REPORT_REASON_LENGTH = 500;
// However many reports land, the same listing keeps working until this
// many distinct people have flagged it — then it's taken down automatically.
export const AUTO_DELETE_REPORT_THRESHOLD = 3;

export interface ReportResult {
  reported: boolean;
  reportCount: number;
  autoDeleted: boolean;
}

export function reportListing(listingId: string, reporterId: number, reason: string): ReportResult {
  const numId = Number(listingId);
  const info = db
    .prepare(
      `INSERT OR IGNORE INTO listing_reports (listing_id, reporter_id, reason) VALUES (?, ?, ?)`
    )
    .run(numId, reporterId, reason);

  const reportCount = (
    db.prepare("SELECT COUNT(*) as c FROM listing_reports WHERE listing_id = ?").get(numId) as {
      c: number;
    }
  ).c;

  const autoDeleted = reportCount >= AUTO_DELETE_REPORT_THRESHOLD && deleteListing(listingId);

  return { reported: info.changes > 0, reportCount, autoDeleted };
}

export interface ReportedListingSummary {
  listingId: string;
  title: string;
  reportCount: number;
  reasons: string[];
}

export function getReportedListings(): ReportedListingSummary[] {
  const rows = db
    .prepare(
      `SELECT l.id as listing_id, l.title as title,
              COUNT(r.id) as report_count,
              GROUP_CONCAT(r.reason, '||') as reasons
       FROM listing_reports r
       JOIN listings l ON l.id = r.listing_id
       GROUP BY r.listing_id
       ORDER BY report_count DESC, r.listing_id DESC`
    )
    .all() as {
    listing_id: number;
    title: string;
    report_count: number;
    reasons: string | null;
  }[];

  return rows.map((row) => ({
    listingId: String(row.listing_id),
    title: row.title,
    reportCount: row.report_count,
    reasons: row.reasons ? row.reasons.split("||").filter(Boolean) : [],
  }));
}
