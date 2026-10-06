export type ListingStatus = "active" | "resolved";
export type ListingKind = "lost" | "found";

export type CategoryId =
  | "hujjatlar"
  | "texnika"
  | "sumka"
  | "hayvonlar"
  | "kalitlar"
  | "kiyim"
  | "boshqa";

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

// A separate taxonomy for "Aksiyalar" (business promos/deals) — deliberately
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
  reward?: number;
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
  isPromo: boolean;
  promoCategory: PromoCategoryId | null;
  resolvedById: number | null;
  resolvedByName: string | null;
  resolvedByAvatarColor: string | null;
  resolvedByAvatarUrl: string | null;
}
