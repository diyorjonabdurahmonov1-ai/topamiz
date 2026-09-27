export const LOCALES = ["uz", "ru", "kk", "tg", "ky", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  kk: "Қазақша",
  tg: "Тоҷикӣ",
  ky: "Кыргызча",
  en: "English",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export const LOCALE_COOKIE = "NEXT_LOCALE";

// Maps a visitor's IP-derived country to the site's language, for a
// first-time visitor who hasn't picked a language yet. Countries not listed
// here fall back to Russian rather than Uzbek — closer to a working default
// for a random unmapped country than this app's original home language.
const COUNTRY_LOCALE: Record<string, Locale> = {
  UZ: "uz",
  RU: "ru",
  KZ: "kk",
  TJ: "tg",
  KG: "ky",
  US: "en",
  GB: "en",
  CA: "en",
  AU: "en",
  NZ: "en",
  IE: "en",
};

export function localeForCountry(country: string | null): Locale {
  if (!country) return DEFAULT_LOCALE;
  return COUNTRY_LOCALE[country] ?? "ru";
}
