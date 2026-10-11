import type { CategoryId, Currency, ListingAttrs, ListingKind } from "./types";

// The shape of Findo's listings: which kinds of listing exist, which
// categories each offers, and the extra fields a category asks for. Shared by
// the post form, the API (which validates against it) and the pages that show
// listings. Client-safe — no server imports.

export const LISTING_KINDS: ListingKind[] = ["sell", "rent", "job", "service", "lost", "found"];

export const CATEGORIES_FOR_KIND: Record<ListingKind, CategoryId[]> = {
  sell: ["transport", "kochmas_mulk", "texnika", "uy_rozgor", "kiyim", "bolalar", "hayvonlar", "sport", "boshqa"],
  rent: ["kochmas_mulk", "transport", "boshqa"],
  job: ["ish"],
  service: ["xizmatlar"],
  lost: ["hujjatlar", "texnika", "sumka", "hayvonlar", "kalitlar", "kiyim", "boshqa"],
  found: ["hujjatlar", "texnika", "sumka", "hayvonlar", "kalitlar", "kiyim", "boshqa"],
};

// Every category, in the order the home page and filters list them.
export const ALL_CATEGORIES: CategoryId[] = [
  "transport",
  "kochmas_mulk",
  "ish",
  "xizmatlar",
  "texnika",
  "uy_rozgor",
  "kiyim",
  "bolalar",
  "hayvonlar",
  "sport",
  "hujjatlar",
  "sumka",
  "kalitlar",
  "boshqa",
];

export function categoriesFor(kind: ListingKind): CategoryId[] {
  return CATEGORIES_FOR_KIND[kind];
}

export function isCategoryAllowed(kind: ListingKind, category: CategoryId): boolean {
  return CATEGORIES_FOR_KIND[kind].includes(category);
}

export function defaultCategory(kind: ListingKind): CategoryId {
  const list = CATEGORIES_FOR_KIND[kind];
  return list.includes("boshqa") ? "boshqa" : list[0];
}

export function isLostFound(kind: ListingKind): boolean {
  return kind === "lost" || kind === "found";
}

// Listings that carry a price: a sale, a rent, a salary, a service rate.
export function kindHasPrice(kind: ListingKind): boolean {
  return !isLostFound(kind);
}

// Cars and property are priced in dollars in Uzbekistan; everything else in
// so'm. Only the default — the poster can switch.
export function defaultCurrency(kind: ListingKind, category: CategoryId): Currency {
  return (kind === "sell" && (category === "transport" || category === "kochmas_mulk")) ? "USD" : "UZS";
}

export type AttrKey =
  | "year"
  | "mileage"
  | "transmission"
  | "fuel"
  | "propertyType"
  | "rooms"
  | "area"
  | "floor"
  | "totalFloors"
  | "condition"
  | "employment";

export type FieldDef =
  | { key: AttrKey; type: "number"; min: number; max: number; unit?: "km" | "m2" }
  | { key: AttrKey; type: "select"; options: string[] };

const CURRENT_YEAR = new Date().getFullYear();

const CAR_FIELDS: FieldDef[] = [
  { key: "year", type: "number", min: 1950, max: CURRENT_YEAR + 1 },
  { key: "mileage", type: "number", min: 0, max: 2_000_000, unit: "km" },
  { key: "transmission", type: "select", options: ["avtomat", "mexanika"] },
  { key: "fuel", type: "select", options: ["benzin", "gaz", "dizel", "elektr", "gibrid"] },
];

const PROPERTY_FIELDS: FieldDef[] = [
  { key: "propertyType", type: "select", options: ["kvartira", "hovli", "tijorat", "yer"] },
  { key: "rooms", type: "number", min: 1, max: 30 },
  { key: "area", type: "number", min: 1, max: 1_000_000, unit: "m2" },
  { key: "floor", type: "number", min: 0, max: 100 },
  { key: "totalFloors", type: "number", min: 1, max: 100 },
];

const CONDITION_FIELD: FieldDef = { key: "condition", type: "select", options: ["yangi", "ishlatilgan"] };

const JOB_FIELDS: FieldDef[] = [
  { key: "employment", type: "select", options: ["toliq", "yarim", "masofaviy", "smenali"] },
];

// All optional: a field left empty is simply not shown.
export function fieldsFor(kind: ListingKind, category: CategoryId): FieldDef[] {
  if (kind === "job") return JOB_FIELDS;
  if (kind === "sell" || kind === "rent") {
    if (category === "transport") return CAR_FIELDS;
    if (category === "kochmas_mulk") return PROPERTY_FIELDS;
    if (kind === "sell" && category !== "hayvonlar") return [CONDITION_FIELD];
  }
  return [];
}

// Keeps only the fields this kind/category defines, with values in range or
// from the allowed options — whatever a client sends.
export function sanitizeAttrs(kind: ListingKind, category: CategoryId, raw: unknown): ListingAttrs {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: ListingAttrs = {};
  for (const field of fieldsFor(kind, category)) {
    const value = input[field.key];
    if (field.type === "number") {
      const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
      if (Number.isFinite(n) && n >= field.min && n <= field.max) out[field.key] = Math.round(n);
    } else if (typeof value === "string" && field.options.includes(value)) {
      out[field.key] = value;
    }
  }
  return out;
}

export const MAX_PRICE = 1_000_000_000_000; // so'm — a sanity cap, not a business rule

export function formatPrice(price: number, currency: Currency): string {
  const grouped = Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return currency === "USD" ? `$${grouped}` : `${grouped} so'm`;
}
