import { db } from "./db";
import type { CategoryId, Listing, ListingKind } from "./types";
import { coordinatesForCity } from "./city-coordinates";
import { displayIdentity } from "./auth";

export const MAX_LISTING_TITLE_LENGTH = 120;
export const MAX_LISTING_DESCRIPTION_LENGTH = 2000;
export const MAX_LISTING_PHOTOS = 6;
export const MAX_CONTACT_NAME_LENGTH = 80;
export const MAX_CONTACT_PHONE_LENGTH = 30;
export const MAX_DISTRICT_LENGTH = 80;

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
  is_mystery_box: number;
  expires_at: string | null;
  resolved_by: number | null;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_avatar_color: string | null;
  owner_avatar_url: string | null;
  resolver_name: string | null;
  resolver_email: string | null;
  resolver_avatar_color: string | null;
  resolver_avatar_url: string | null;
}

// Every listing query joins in just enough of the owner's identity to show
// an Instagram-style byline on the card without a listing view — routed
// through displayIdentity() so an admin's own listing still shows as the
// Findo brand instead of their personal account, same as everywhere else.
// A second join brings in whichever claimed finder the owner confirmed
// (resolved_by), so a resolved listing can credit them by name too.
const LISTING_SELECT = `
  SELECT listings.*,
    users.name AS owner_name,
    users.email AS owner_email,
    users.avatar_color AS owner_avatar_color,
    users.avatar_url AS owner_avatar_url,
    resolver.name AS resolver_name,
    resolver.email AS resolver_email,
    resolver.avatar_color AS resolver_avatar_color,
    resolver.avatar_url AS resolver_avatar_url
  FROM listings
  LEFT JOIN users ON users.id = listings.owner_id
  LEFT JOIN users resolver ON resolver.id = listings.resolved_by
`;

function toListing(row: RawListingRow): Listing {
  const category = row.category as CategoryId;
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.boshqa;
  const ownerIdentity =
    row.owner_id && row.owner_name
      ? displayIdentity({
          email: row.owner_email ?? "",
          name: row.owner_name,
          avatarColor: row.owner_avatar_color ?? "#6366f1",
          avatarUrl: row.owner_avatar_url,
        })
      : null;
  const resolverIdentity =
    row.resolved_by && row.resolver_name
      ? displayIdentity({
          email: row.resolver_email ?? "",
          name: row.resolver_name,
          avatarColor: row.resolver_avatar_color ?? "#6366f1",
          avatarUrl: row.resolver_avatar_url,
        })
      : null;
  return {
    id: String(row.id),
    ownerId: row.owner_id,
    ownerName: ownerIdentity?.name ?? null,
    ownerAvatarColor: ownerIdentity?.avatarColor ?? null,
    ownerAvatarUrl: ownerIdentity?.avatarUrl ?? null,
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
    isMysteryBox: !!row.is_mystery_box,
    // Stored as a naive "YYYY-MM-DD HH:MM:SS" UTC string (to compare directly
    // against SQLite's own datetime('now') at query time) — but `new Date()`
    // parses that exact shape as local time, not UTC, in browsers. Appending
    // a 'Z' makes it an unambiguous ISO instant for every consumer.
    expiresAt: row.expires_at ? `${row.expires_at.replace(" ", "T")}Z` : null,
    resolvedById: row.resolved_by,
    resolvedByName: resolverIdentity?.name ?? null,
    resolvedByAvatarColor: resolverIdentity?.avatarColor ?? null,
    resolvedByAvatarUrl: resolverIdentity?.avatarUrl ?? null,
  };
}

// `country` filters listings down to the visitor's own country (detected via
// IP, see lib/geo.ts) so that as this site expands beyond Uzbekistan, users
// in different countries never see each other's listings mixed together.
// Excludes Sirli quti listings — they have their own dedicated, login-gated
// page (getMysteryBoxListings) and must never surface in the general
// lost/found feed this powers (home page tabs, etc).
export function getAllActiveListings(country: string): Listing[] {
  const rows = db
    .prepare(
      `${LISTING_SELECT} WHERE listings.status = 'active' AND listings.country = ? AND listings.is_mystery_box = 0
       ORDER BY listings.created_at DESC, listings.id DESC`
    )
    .all(country) as RawListingRow[];
  return rows.map(toListing);
}

// Same as above but also includes resolved ("found it!") listings — used
// only by the main browse/search page, so someone who finds a listing via
// search still sees it (with the resolved overlay) instead of it silently
// vanishing, which would look like it never existed. Also excludes Sirli
// quti listings, same reason as getAllActiveListings above.
export function getAllListings(country: string): Listing[] {
  const rows = db
    .prepare(
      `${LISTING_SELECT} WHERE listings.country = ? AND listings.is_mystery_box = 0
       ORDER BY listings.created_at DESC, listings.id DESC`
    )
    .all(country) as RawListingRow[];
  return rows.map(toListing);
}

export function getListingById(id: string): Listing | null {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  const row = db.prepare(`${LISTING_SELECT} WHERE listings.id = ?`).get(numId) as
    | RawListingRow
    | undefined;
  return row ? toListing(row) : null;
}

export function getRewardedListings(country: string): Listing[] {
  const rows = db
    .prepare(
      `${LISTING_SELECT} WHERE listings.status = 'active' AND listings.country = ? AND listings.reward IS NOT NULL
       ORDER BY listings.reward DESC, listings.id DESC`
    )
    .all(country) as RawListingRow[];
  return rows.map(toListing);
}

// "Sirli quti" — creative promotional listings (a hidden prize, a partner's
// discount code) get their own dedicated page, separate from ordinary
// lost/found browsing. No background jobs run in this app, so an expired
// box is filtered out here at query time rather than deactivated by a cron.
export function getMysteryBoxListings(country: string): Listing[] {
  const rows = db
    .prepare(
      `${LISTING_SELECT} WHERE listings.status = 'active' AND listings.country = ? AND listings.is_mystery_box = 1
       AND (listings.expires_at IS NULL OR listings.expires_at > datetime('now'))
       ORDER BY listings.created_at DESC, listings.id DESC`
    )
    .all(country) as RawListingRow[];
  return rows.map(toListing);
}

export function setMysteryBox(id: string, value: boolean): boolean {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return false;
  const info = db
    .prepare("UPDATE listings SET is_mystery_box = ? WHERE id = ?")
    .run(value ? 1 : 0, numId);
  return info.changes > 0;
}

// Admin oversight — unlike every other listing query, deliberately has no
// country or status filter, so admin sees the whole site at once.
export function getAllListingsForAdmin(): Listing[] {
  const rows = db
    .prepare(`${LISTING_SELECT} ORDER BY listings.created_at DESC, listings.id DESC`)
    .all() as RawListingRow[];
  return rows.map(toListing);
}

export function getListingCountsByCountry(): { country: string; count: number }[] {
  return db
    .prepare("SELECT country, COUNT(*) as count FROM listings GROUP BY country ORDER BY count DESC")
    .all() as { country: string; count: number }[];
}

export function getListingsByOwner(ownerId: number): Listing[] {
  const rows = db
    .prepare(
      `${LISTING_SELECT} WHERE listings.owner_id = ? ORDER BY listings.created_at DESC, listings.id DESC`
    )
    .all(ownerId) as RawListingRow[];
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
  district?: string | null;
  reward: number | null;
  contactName: string;
  contactPhone: string;
  photoUrls: string[];
  country: string;
  lat?: number;
  lng?: number;
  isMysteryBox?: boolean;
  expiresAt?: string | null;
}): Listing {
  const info = db
    .prepare(
      `INSERT INTO listings
        (owner_id, kind, title, description, category, city, district, reward, contact_name, contact_phone, photo_urls, country, lat, lng, is_mystery_box, expires_at)
       VALUES (@ownerId, @kind, @title, @description, @category, @city, @district, @reward, @contactName, @contactPhone, @photoUrls, @country, @lat, @lng, @isMysteryBox, @expiresAt)`
    )
    .run({
      ownerId: params.ownerId,
      kind: params.kind,
      title: params.title,
      description: params.description,
      category: params.category,
      city: params.city,
      district: params.district ?? null,
      reward: params.reward,
      contactName: params.contactName,
      contactPhone: params.contactPhone,
      photoUrls: JSON.stringify(params.photoUrls),
      country: params.country,
      lat: params.lat ?? null,
      lng: params.lng ?? null,
      isMysteryBox: params.isMysteryBox ? 1 : 0,
      expiresAt: params.expiresAt ?? null,
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

// `resolvedBy` credits the specific claimed finder the owner confirmed —
// only meaningful when resolving, so it's always cleared back to NULL on
// reactivation rather than left stale on a listing that's active again.
export function setListingStatus(id: string, status: Listing["status"], resolvedBy?: number | null): boolean {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return false;
  const info = db
    .prepare("UPDATE listings SET status = ?, resolved_by = ? WHERE id = ?")
    .run(status, status === "resolved" ? (resolvedBy ?? null) : null, numId);
  return info.changes > 0;
}
