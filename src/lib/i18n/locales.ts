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
