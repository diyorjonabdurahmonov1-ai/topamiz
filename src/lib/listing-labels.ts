import type { Dictionary } from "./i18n";
import type { Listing, ListingKind } from "./types";
import { fieldsFor, formatPrice, kindHasPrice, type AttrKey } from "./sections";

// How a listing's kind, price and details read on cards and pages — one
// place, so "Sotiladi", "$12 500" and "Probeg: 85 000 km" look the same
// everywhere.

export function kindLabel(dict: Dictionary, kind: ListingKind): string {
  const c = dict.classifieds;
  switch (kind) {
    case "sell":
      return c.kindSell;
    case "rent":
      return c.kindRent;
    case "job":
      return c.kindJob;
    case "service":
      return c.kindService;
    case "lost":
      return dict.common.lost;
    case "found":
      return dict.common.found;
  }
}

// Badge colours: red for lost (urgent), sky for found, brand tones for the rest.
export const KIND_BADGE_CLASS: Record<ListingKind, string> = {
  sell: "bg-emerald-500",
  rent: "bg-teal-500",
  job: "bg-blue-600",
  service: "bg-cyan-600",
  lost: "bg-danger",
  found: "bg-sky-500",
};

export function resolvedLabel(dict: Dictionary, kind: ListingKind): string {
  const c = dict.classifieds;
  if (kind === "sell") return c.resolvedSell;
  if (kind === "rent") return c.resolvedRent;
  if (kind === "job") return c.resolvedJob;
  if (kind === "service") return c.resolvedService;
  return dict.common.resolved;
}

export function markDoneLabel(dict: Dictionary, kind: ListingKind): string {
  const c = dict.classifieds;
  if (kind === "sell") return c.markDoneSell;
  if (kind === "rent") return c.markDoneRent;
  if (kind === "job") return c.markDoneJob;
  if (kind === "service") return c.markDoneService;
  return dict.myListings.markResolved;
}

export function priceLabel(dict: Dictionary, kind: ListingKind): string {
  const c = dict.classifieds;
  if (kind === "rent") return c.priceRent;
  if (kind === "job") return c.priceJob;
  if (kind === "service") return c.priceService;
  return c.priceSell;
}

// "$12 500", "3 500 000 so'm" or "Kelishiladi"; null when the listing has
// no price to show (lost & found, or a price simply left out).
export function priceText(dict: Dictionary, listing: Pick<Listing, "kind" | "price" | "currency" | "priceNegotiable">): string | null {
  if (!kindHasPrice(listing.kind)) return null;
  if (listing.price) return formatPrice(listing.price, listing.currency);
  return listing.priceNegotiable ? dict.classifieds.negotiable : null;
}

function attrValue(dict: Dictionary, key: AttrKey, value: string | number): string {
  const c = dict.classifieds;
  if (typeof value === "string") return c.options[value] ?? value;
  const grouped = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (key === "mileage") return `${grouped} ${c.unitKm}`;
  if (key === "area") return `${grouped} ${c.unitM2}`;
  return key === "year" ? String(value) : grouped;
}

// The listing's details as label/value rows, in the field order the form
// asks for them; fields left empty are skipped.
export function attrRows(dict: Dictionary, listing: Pick<Listing, "kind" | "category" | "attrs">): { label: string; value: string }[] {
  return fieldsFor(listing.kind, listing.category)
    .filter((f) => listing.attrs[f.key] !== undefined && listing.attrs[f.key] !== "")
    .map((f) => ({ label: dict.classifieds.attrs[f.key], value: attrValue(dict, f.key, listing.attrs[f.key]) }));
}

// A short one-line summary for cards: "2019 · 85 000 km · Avtomat".
export function attrSummary(dict: Dictionary, listing: Pick<Listing, "kind" | "category" | "attrs">, max = 3): string {
  return attrRows(dict, listing)
    .slice(0, max)
    .map((r) => r.value)
    .join(" · ");
}
