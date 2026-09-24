import { db } from "./db";

export const MAX_COMPANY_LENGTH = 120;
export const MAX_PHONE_LENGTH = 30;
export const MAX_MESSAGE_LENGTH = 1000;

export interface AdInquiry {
  id: number;
  company: string;
  phone: string;
  message: string;
  handledAt: string | null;
  createdAt: string;
}

interface AdInquiryRow {
  id: number;
  company: string;
  phone: string;
  message: string;
  handled_at: string | null;
  created_at: string;
}

function toAdInquiry(row: AdInquiryRow): AdInquiry {
  return {
    id: row.id,
    company: row.company,
    phone: row.phone,
    message: row.message,
    handledAt: row.handled_at,
    createdAt: row.created_at,
  };
}

export function createAdInquiry(params: { company: string; phone: string; message: string }): AdInquiry {
  const info = db
    .prepare("INSERT INTO ad_inquiries (company, phone, message) VALUES (?, ?, ?)")
    .run(params.company, params.phone, params.message);
  const row = db
    .prepare("SELECT * FROM ad_inquiries WHERE id = ?")
    .get(info.lastInsertRowid) as AdInquiryRow;
  return toAdInquiry(row);
}

export function getAdInquiries(): AdInquiry[] {
  const rows = db
    .prepare("SELECT * FROM ad_inquiries ORDER BY handled_at IS NOT NULL, created_at DESC")
    .all() as AdInquiryRow[];
  return rows.map(toAdInquiry);
}

export function countUnhandledAdInquiries(): number {
  return (
    db.prepare("SELECT COUNT(*) as c FROM ad_inquiries WHERE handled_at IS NULL").get() as {
      c: number;
    }
  ).c;
}

export function setAdInquiryHandled(id: number, handled: boolean): boolean {
  const info = db
    .prepare(`UPDATE ad_inquiries SET handled_at = ? WHERE id = ?`)
    .run(handled ? new Date().toISOString() : null, id);
  return info.changes > 0;
}
