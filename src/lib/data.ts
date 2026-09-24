import type { Category } from "./types";

export const categories: Category[] = [
  { id: "hujjatlar", label: "Hujjatlar", icon: "IdCard" },
  { id: "texnika", label: "Telefon va texnika", icon: "Smartphone" },
  { id: "sumka", label: "Sumka va hamyon", icon: "Briefcase" },
  { id: "hayvonlar", label: "Uy hayvonlari", icon: "PawPrint" },
  { id: "kalitlar", label: "Kalitlar", icon: "KeyRound" },
  { id: "kiyim", label: "Kiyim-kechak", icon: "Shirt" },
  { id: "boshqa", label: "Boshqa", icon: "Sparkles" },
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

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

// Intl.NumberFormat/DateTimeFormat("uz-UZ") render inconsistently between the
// server and browser ICU data, which breaks hydration — format manually instead.
export function formatSom(amount: number): string {
  const grouped = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} so'm`;
}

export function formatDate(iso: string): string {
  // Parsed as UTC midnight since these are date-only strings; read back with
  // the UTC getters so the result doesn't shift with the viewer's timezone.
  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${day}-${UZ_MONTHS[date.getUTCMonth()]}`;
}
