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
  country: string;
  lat: number;
  lng: number;
  isMysteryBox: boolean;
  expiresAt: string | null;
  resolvedById: number | null;
  resolvedByName: string | null;
  resolvedByAvatarColor: string | null;
  resolvedByAvatarUrl: string | null;
}
