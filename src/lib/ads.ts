import { db } from "./db";

export const MAX_AD_TITLE_LENGTH = 100;
export const MAX_AD_LINK_LENGTH = 500;

export type AdMediaType = "image" | "video";

export interface AdBanner {
  id: number;
  mediaUrl: string;
  mediaType: AdMediaType;
  linkUrl: string;
  title: string;
  active: boolean;
  createdAt: string;
}

interface RawAdRow {
  id: number;
  media_url: string;
  media_type: string;
  link_url: string;
  title: string;
  active: number;
  sort_order: number;
  created_at: string;
}

function toAd(row: RawAdRow): AdBanner {
  return {
    id: row.id,
    mediaUrl: row.media_url,
    mediaType: row.media_type as AdMediaType,
    linkUrl: row.link_url,
    title: row.title,
    active: !!row.active,
    createdAt: row.created_at,
  };
}

export function getActiveAds(): AdBanner[] {
  const rows = db
    .prepare("SELECT * FROM ads WHERE active = 1 ORDER BY sort_order ASC, created_at DESC")
    .all() as RawAdRow[];
  return rows.map(toAd);
}

export function getAllAds(): AdBanner[] {
  const rows = db
    .prepare("SELECT * FROM ads ORDER BY sort_order ASC, created_at DESC")
    .all() as RawAdRow[];
  return rows.map(toAd);
}

export function getAdById(id: number): AdBanner | null {
  const row = db.prepare("SELECT * FROM ads WHERE id = ?").get(id) as RawAdRow | undefined;
  return row ? toAd(row) : null;
}

export function createAd(params: {
  mediaUrl: string;
  mediaType: AdMediaType;
  linkUrl: string;
  title: string;
}): AdBanner {
  const next = db.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 as n FROM ads").get() as {
    n: number;
  };
  const info = db
    .prepare(
      `INSERT INTO ads (media_url, media_type, link_url, title, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(params.mediaUrl, params.mediaType, params.linkUrl, params.title, next.n);
  const ad = getAdById(Number(info.lastInsertRowid));
  if (!ad) throw new Error("Reklama yaratilmadi");
  return ad;
}

export function setAdActive(id: number, active: boolean): boolean {
  const info = db.prepare("UPDATE ads SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
  return info.changes > 0;
}

export function deleteAd(id: number): boolean {
  const info = db.prepare("DELETE FROM ads WHERE id = ?").run(id);
  return info.changes > 0;
}
