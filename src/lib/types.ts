export type ListingStatus = "active" | "resolved";
// What the listing is: something for sale or rent, a job opening, a service
// — or, where Findo started, something lost or found. Which categories and
// fields each one offers lives in lib/sections.ts.
export type ListingKind = "sell" | "rent" | "job" | "service" | "lost" | "found";

export type CategoryId =
  // lost & found
  | "hujjatlar"
  | "sumka"
  | "kalitlar"
  // shared with sale listings
  | "texnika"
  | "hayvonlar"
  | "kiyim"
  | "boshqa"
  // sale / rent / jobs / services
  | "transport"
  | "kochmas_mulk"
  | "uy_rozgor"
  | "bolalar"
  | "sport"
  | "ish"
  | "xizmatlar";

export type Currency = "UZS" | "USD";

// Category-specific details — a car's year and mileage, a flat's rooms and
// area, a job's schedule. Keys and allowed values are defined (and
// validated) in lib/sections.ts.
export type ListingAttrs = Record<string, string | number>;

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

// A separate taxonomy for "Takliflar" (business promos/deals) — deliberately
// not shared with CategoryId's lost/found categories, since a shop promo and
// a lost wallet aren't the same kind of thing to browse or filter by.
export type PromoCategoryId =
  | "oziq_ovqat"
  | "kafe_restoran"
  | "kiyim_poyabzal"
  | "gozallik"
  | "texnika_dokon"
  | "xizmatlar"
  | "boshqa";

export interface PromoCategory {
  id: PromoCategoryId;
  label: string;
  icon: string;
}

export interface Listing {
  id: string;
  ownerId: number | null;
  ownerName: string | null;
  ownerAvatarColor: string | null;
  ownerAvatarUrl: string | null;
  kind: ListingKind;
  title: string;
  description: string;
  category: CategoryId;
  city: string;
  district?: string;
  date: string;
  // When it was posted (UTC, "YYYY-MM-DD HH:MM:SS") — for "2 soat oldin".
  createdAt: string;
  reward?: number;
  // Asking price (or salary for a job). Null = not given, which reads as
  // "kelishiladi" when priceNegotiable is set.
  price: number | null;
  currency: Currency;
  priceNegotiable: boolean;
  attrs: ListingAttrs;
  contactName: string;
  contactPhone: string;
  status: ListingStatus;
  colorFrom: string;
  colorTo: string;
  views: number;
  photoUrls: string[];
  videoUrl: string | null;
  videoThumbnailUrl: string | null;
  likeCount: number;
  commentCount: number;
  country: string;
  lat: number;
  lng: number;
  isMysteryBox: boolean;
  expiresAt: string | null;
  startsAt: string | null;
  isPromo: boolean;
  promoCategory: PromoCategoryId | null;
  resolvedById: number | null;
  resolvedByName: string | null;
  resolvedByAvatarColor: string | null;
  resolvedByAvatarUrl: string | null;
}
