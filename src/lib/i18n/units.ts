import type { Locale } from "./locales";

// What a price and a date are called in each language. Written out, not
// asked of Intl: a browser's own Intl data lacks Uzbek, Kazakh, Kyrgyz and
// Tajik, and the page redraws with the browser's answer (see format.ts).

// The Uzbek sum. Kyrgyz "сом" and Tajik "сомонӣ" are other countries' money,
// so the Uzbek sum is spelled out there as "сум" / "сӯм".
export const SUM_WORD: Record<Locale, string> = {
  uz: "so'm",
  ru: "сум",
  en: "UZS",
  kk: "сум",
  ky: "сум",
  tg: "сӯм",
};

// A short date: "09-oktabr", "9 октября", "9 Oct"…
export const MONTHS: Record<Locale, string[]> = {
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  kk: ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"],
  ky: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
  tg: ["январ", "феврал", "март", "апрел", "май", "июн", "июл", "август", "сентябр", "октябр", "ноябр", "декабр"],
};

export function formatDay(day: number, month: number, locale: Locale): string {
  const name = MONTHS[locale][month];
  return locale === "uz" ? `${String(day).padStart(2, "0")}-${name}` : `${day} ${name}`;
}
