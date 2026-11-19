import type { Category, PromoCategory } from "./types";
import type { Locale } from "./i18n/locales";
import { formatDay, SUM_WORD } from "./i18n/units";

export const categories: Category[] = [
  { id: "hujjatlar", label: "Hujjatlar", icon: "IdCard" },
  { id: "texnika", label: "Telefon va texnika", icon: "Smartphone" },
  { id: "sumka", label: "Sumka va hamyon", icon: "Briefcase" },
  { id: "hayvonlar", label: "Uy hayvonlari", icon: "PawPrint" },
  { id: "kalitlar", label: "Kalitlar", icon: "KeyRound" },
  { id: "kiyim", label: "Kiyim-kechak", icon: "Shirt" },
  { id: "boshqa", label: "Boshqa", icon: "Sparkles" },
  { id: "transport", label: "Transport", icon: "Car" },
  { id: "kochmas_mulk", label: "Ko'chmas mulk", icon: "Building2" },
  { id: "uy_rozgor", label: "Uy-ro'zg'or", icon: "Sofa" },
  { id: "bolalar", label: "Bolalar uchun", icon: "Baby" },
  { id: "sport", label: "Sport va hobbi", icon: "Dumbbell" },
  { id: "ish", label: "Ish", icon: "BriefcaseBusiness" },
  { id: "xizmatlar", label: "Xizmatlar", icon: "Wrench" },
];

export const promoCategories: PromoCategory[] = [
  { id: "oziq_ovqat", label: "Oziq-ovqat", icon: "ShoppingBasket" },
  { id: "kafe_restoran", label: "Kafe va restoran", icon: "UtensilsCrossed" },
  { id: "kiyim_poyabzal", label: "Kiyim-poyabzal", icon: "Shirt" },
  { id: "gozallik", label: "Go'zallik va salon", icon: "Scissors" },
  { id: "texnika_dokon", label: "Texnika do'konlari", icon: "Smartphone" },
  { id: "xizmatlar", label: "Xizmatlar", icon: "Wrench" },
  { id: "boshqa", label: "Boshqa", icon: "Tag" },
];

export const cities: string[] = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Farg'ona",
  "Namangan",
  "Nukus",
  "Qarshi",
];

// Intl.NumberFormat/DateTimeFormat("uz-UZ") render inconsistently between the
// server and browser ICU data, which breaks hydration — format manually
// instead, in the visitor's language (i18n/units.ts). Uzbek by default: the
// admin pages are in Uzbek.
export function formatSom(amount: number, locale: Locale = "uz"): string {
  const grouped = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} ${SUM_WORD[locale]}`;
}

export function formatDate(iso: string, locale: Locale = "uz"): string {
  // Parsed as UTC midnight since these are date-only strings; read back with
  // the UTC getters so the result doesn't shift with the viewer's timezone.
  const date = new Date(iso);
  return formatDay(date.getUTCDate(), date.getUTCMonth(), locale);
}
