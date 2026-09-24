import type { Locale } from "./locales";
import type { Dictionary } from "./types";
import uz from "./dictionaries/uz";
import ru from "./dictionaries/ru";
import kk from "./dictionaries/kk";
import tg from "./dictionaries/tg";
import ky from "./dictionaries/ky";
import en from "./dictionaries/en";

export type { Dictionary } from "./types";

const DICTIONARIES: Record<Locale, Dictionary> = { uz, ru, kk, tg, ky, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export { LOCALES, LOCALE_LABELS, DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./locales";
