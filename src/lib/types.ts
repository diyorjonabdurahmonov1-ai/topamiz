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
  country: string;
  lat: number;
  lng: number;
}
