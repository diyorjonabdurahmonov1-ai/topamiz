import type { Locale } from "./locales";

// These need locale-aware pluralization, so they're plain functions
// components import directly, never fields inside a Dictionary — a
// Dictionary object crosses the Server→Client Component boundary as a prop
// in many places, and React can't serialize functions across that boundary.

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function formatItemsCount(locale: Locale, n: number): string {
  switch (locale) {
    case "ru":
      return `${n} ${pluralRu(n, "объявление", "объявления", "объявлений")}`;
    case "en":
      return `${n} listing${n === 1 ? "" : "s"}`;
    case "kk":
      return `${n} хабарландыру`;
    case "tg":
      return `${n} эълон`;
    case "ky":
      return `${n} жарыя`;
    default:
      return `${n} ta e'lon`;
  }
}

export function formatResultsCount(locale: Locale, n: number): string {
  switch (locale) {
    case "ru":
      return `Найдено ${n} ${pluralRu(n, "объявление", "объявления", "объявлений")}`;
    case "en":
      return `${n} listing${n === 1 ? "" : "s"} found`;
    case "kk":
      return `${n} хабарландыру табылды`;
    case "tg":
      return `${n} эълон ёфт шуд`;
    case "ky":
      return `${n} жарыя табылды`;
    default:
      return `${n} ta e'lon topildi`;
  }
}

export function formatViewsCount(locale: Locale, n: number): string {
  switch (locale) {
    case "ru":
      return pluralRu(n, "1 просмотр", `${n} просмотра`, `${n} просмотров`);
    case "en":
      return `Viewed ${n} time${n === 1 ? "" : "s"}`;
    case "kk":
      return `${n} рет қаралды`;
    case "tg":
      return `${n} бор дида шуд`;
    case "ky":
      return `${n} жолу көрүлдү`;
    default:
      return `${n} marta ko'rilgan`;
  }
}

export function formatCopyright(locale: Locale, year: number): string {
  switch (locale) {
    case "ru":
      return `© ${year} Topamiz. Все права защищены.`;
    case "en":
      return `© ${year} Topamiz. All rights reserved.`;
    case "kk":
      return `© ${year} Topamiz. Барлық құқықтар қорғалған.`;
    case "tg":
      return `© ${year} Topamiz. Ҳамаи ҳуқуқҳо ҳифз шудаанд.`;
    case "ky":
      return `© ${year} Topamiz. Бардык укуктар корголгон.`;
    default:
      return `© ${year} Topamiz. Barcha huquqlar himoyalangan.`;
  }
}

export function formatPostSuccessBody(locale: Locale, kindLabel: string, title: string): string {
  switch (locale) {
    case "ru":
      return `Объявление "${title}" добавлено в список ${kindLabel} вещей.`;
    case "en":
      return `"${title}" was added to the list of ${kindLabel} items.`;
    case "kk":
      return `"${title}" хабарландыруы ${kindLabel} заттар тізіміне қосылды.`;
    case "tg":
      return `Эълони "${title}" ба рӯйхати чизҳои ${kindLabel} илова карда шуд.`;
    case "ky":
      return `"${title}" жарыясы ${kindLabel} заттар тизмесине кошулду.`;
    default:
      return `"${title}" e'loni ${kindLabel} buyumlar ro'yxatiga qo'shildi.`;
  }
}
