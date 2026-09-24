import { db } from "./db";
import type { CategoryId, Listing, ListingKind } from "./types";
import { coordinatesForCity } from "./city-coordinates";

export const MAX_LISTING_TITLE_LENGTH = 120;
export const MAX_LISTING_DESCRIPTION_LENGTH = 2000;
export const MAX_LISTING_PHOTOS = 6;
export const MAX_CONTACT_NAME_LENGTH = 80;
export const MAX_CONTACT_PHONE_LENGTH = 30;

// Listings no longer store a color pair — it's derived from category so
// creating one doesn't need a color picker, and it stays consistent site-wide.
const CATEGORY_COLORS: Record<CategoryId, { from: string; to: string }> = {
  hujjatlar: { from: "#6366f1", to: "#22d3ee" },
  texnika: { from: "#0ea5e9", to: "#22d3ee" },
  sumka: { from: "#a855f7", to: "#6366f1" },
  hayvonlar: { from: "#f59e0b", to: "#f97316" },
  kalitlar: { from: "#22c55e", to: "#16a34a" },
  kiyim: { from: "#0ea5e9", to: "#6366f1" },
  boshqa: { from: "#eab308", to: "#f59e0b" },
};

interface RawListingRow {
  id: number;
  owner_id: number | null;
  kind: string;
  title: string;
  description: string;
  category: string;
  city: string;
  district: string | null;
  reward: number | null;
  contact_name: string;
  contact_phone: string;
  status: string;
  photo_urls: string;
  views: number;
  country: string;
  lat: number;
  lng: number;
  created_at: string;
}

function toListing(row: RawListingRow): Listing {
  const category = row.category as CategoryId;
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.boshqa;
  return {
    id: String(row.id),
    kind: row.kind as ListingKind,
    title: row.title,
    description: row.description,
    category,
    city: row.city,
    district: row.district ?? undefined,
    date: row.created_at.slice(0, 10),
    reward: row.reward ?? undefined,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    status: row.status as Listing["status"],
    colorFrom: colors.from,
    colorTo: colors.to,
    views: row.views,
    photoUrls: JSON.parse(row.photo_urls) as string[],
    country: row.country,
    lat: row.lat,
    lng: row.lng,
  };
}

// `country` filters listings down to the visitor's own country (detected via
// IP, see lib/geo.ts) so that as this site expands beyond Uzbekistan, users
// in different countries never see each other's listings mixed together.
export function getAllActiveListings(country: string): Listing[] {
  const rows = db
    .prepare(
      "SELECT * FROM listings WHERE status = 'active' AND country = ? ORDER BY created_at DESC, id DESC"
    )
    .all(country) as RawListingRow[];
  return rows.map(toListing);
}

export function getListingById(id: string): Listing | null {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(numId) as
    | RawListingRow
    | undefined;
  return row ? toListing(row) : null;
}

export function getRewardedListings(country: string): Listing[] {
  const rows = db
    .prepare(
      `SELECT * FROM listings WHERE status = 'active' AND country = ? AND reward IS NOT NULL
       ORDER BY reward DESC, id DESC`
    )
    .all(country) as RawListingRow[];
  return rows.map(toListing);
}

export function getListingStats(): { total: number; active: number } {
  const total = (db.prepare("SELECT COUNT(*) as c FROM listings").get() as { c: number }).c;
  const active = (
    db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'active'").get() as { c: number }
  ).c;
  return { total, active };
}

export function incrementListingViews(id: string): void {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return;
  db.prepare("UPDATE listings SET views = views + 1 WHERE id = ?").run(numId);
}

export function createListing(params: {
  ownerId: number;
  kind: ListingKind;
  title: string;
  description: string;
  category: CategoryId;
  city: string;
  reward: number | null;
  contactName: string;
  contactPhone: string;
  photoUrls: string[];
  country: string;
  lat?: number;
  lng?: number;
}): Listing {
  const info = db
    .prepare(
      `INSERT INTO listings
        (owner_id, kind, title, description, category, city, reward, contact_name, contact_phone, photo_urls, country, lat, lng)
       VALUES (@ownerId, @kind, @title, @description, @category, @city, @reward, @contactName, @contactPhone, @photoUrls, @country, @lat, @lng)`
    )
    .run({
      ownerId: params.ownerId,
      kind: params.kind,
      title: params.title,
      description: params.description,
      category: params.category,
      city: params.city,
      reward: params.reward,
      contactName: params.contactName,
      contactPhone: params.contactPhone,
      photoUrls: JSON.stringify(params.photoUrls),
      country: params.country,
      lat: params.lat ?? null,
      lng: params.lng ?? null,
    });
  const newId = Number(info.lastInsertRowid);
  // No precise location supplied (poster skipped "use my location") — fall
  // back to a jittered point around the city center, seeded by the new row's
  // own id so repeated calls for the same listing stay stable.
  if (params.lat === undefined || params.lng === undefined) {
    const { lat, lng } = coordinatesForCity(params.city, newId);
    db.prepare("UPDATE listings SET lat = ?, lng = ? WHERE id = ?").run(lat, lng, newId);
  }
  const listing = getListingById(String(newId));
  if (!listing) throw new Error("E'lon yaratilmadi");
  return listing;
}

export function deleteListing(id: string): boolean {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return false;
  const info = db.prepare("DELETE FROM listings WHERE id = ?").run(numId);
  return info.changes > 0;
}

export function getListingOwnerId(id: string): number | null {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  const row = db.prepare("SELECT owner_id FROM listings WHERE id = ?").get(numId) as
    | { owner_id: number | null }
    | undefined;
  return row?.owner_id ?? null;
}
