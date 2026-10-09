import { db } from "./db";

export const MAX_AD_TITLE_LENGTH = 100;
export const MAX_AD_LINK_LENGTH = 500;

export type AdMediaType = "image" | "video";

export interface AdBanner {
  id: number;
  mediaUrl: string;
  mediaType: AdMediaType;
  // Empty when the ad has no link — the banner just shows, tapping it does
  // nothing.
  linkUrl: string;
  title: string;
  active: boolean;
  views: number;
  clicks: number;
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
  views: number;
  clicks: number;
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
    views: row.views ?? 0,
    clicks: row.clicks ?? 0,
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

// An empty link is allowed (the banner then isn't clickable); anything else
// must be a plain http(s) URL. Returns null for a link that isn't acceptable.
export function normalizeAdLink(raw: unknown): string | null {
  const link = typeof raw === "string" ? raw.trim().slice(0, MAX_AD_LINK_LENGTH) : "";
  if (!link) return "";
  return /^https?:\/\/[^\s]+$/i.test(link) ? link : null;
}

export function updateAd(id: number, fields: { linkUrl?: string; title?: string }): boolean {
  const ad = getAdById(id);
  if (!ad) return false;
  db.prepare("UPDATE ads SET link_url = ?, title = ? WHERE id = ?").run(
    fields.linkUrl ?? ad.linkUrl,
    fields.title ?? ad.title,
    id
  );
  return true;
}

// Swaps an ad with its neighbour in the rotation order.
export function moveAd(id: number, direction: "up" | "down"): boolean {
  const ads = getAllAds();
  const index = ads.findIndex((a) => a.id === id);
  const other = ads[direction === "up" ? index - 1 : index + 1];
  if (index === -1 || !other) return false;
  const renumber = db.prepare("UPDATE ads SET sort_order = ? WHERE id = ?");
  db.transaction(() => {
    // Renumber everything first: older rows can share a sort_order, which
    // would make a plain swap a no-op.
    ads.forEach((a, i) => renumber.run(i, a.id));
    renumber.run(index, other.id);
    renumber.run(ads.indexOf(other), id);
  })();
  return true;
}

export function recordAdView(id: number) {
  db.prepare("UPDATE ads SET views = views + 1 WHERE id = ? AND active = 1").run(id);
}

export function recordAdClick(id: number) {
  db.prepare("UPDATE ads SET clicks = clicks + 1 WHERE id = ?").run(id);
}
