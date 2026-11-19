import { isLocale, LOCALE_COOKIE, type Locale } from "./locales";

// The 404 and crash screens. They live outside the dictionary because the
// crash screens render when the page — dictionary and all — failed to load,
// so they carry their few sentences themselves.
export interface ErrorPageText {
  errorTitle: string;
  errorBody: string;
  retry: string;
  home: string;
  notFoundLead: string; // "404 — page" …
  notFoundHighlight: string; // … "not found"
  notFoundBody: string;
  backHome: string;
}

export const ERROR_PAGE_TEXT: Record<Locale, ErrorPageText> = {
  uz: {
    errorTitle: "Nimadir xato ketdi",
    errorBody: "Kechirasiz, sahifani yuklashda kutilmagan xatolik yuz berdi. Qayta urinib ko'ring. Agar davom etsa, birozdan so'ng qaytib tashrif buyuring.",
    retry: "Qayta urinish",
    home: "Bosh sahifa",
    notFoundLead: "404 — sahifa",
    notFoundHighlight: "topilmadi",
    notFoundBody: "Qidirayotgan sahifangiz o'chirilgan yoki manzil noto'g'ri bo'lishi mumkin.",
    backHome: "Bosh sahifaga qaytish",
  },
  ru: {
    errorTitle: "Что-то пошло не так",
    errorBody: "Извините, при загрузке страницы произошла непредвиденная ошибка. Попробуйте ещё раз. Если ошибка повторяется, зайдите чуть позже.",
    retry: "Повторить",
    home: "Главная",
    notFoundLead: "404 — страница",
    notFoundHighlight: "не найдена",
    notFoundBody: "Страница удалена или адрес указан неверно.",
    backHome: "Вернуться на главную",
  },
  en: {
    errorTitle: "Something went wrong",
    errorBody: "Sorry, something unexpected happened while loading the page. Please try again. If it keeps happening, come back in a little while.",
    retry: "Try again",
    home: "Home",
    notFoundLead: "404 — page",
    notFoundHighlight: "not found",
    notFoundBody: "The page you're looking for may have been removed, or the address is wrong.",
    backHome: "Back to the home page",
  },
  kk: {
    errorTitle: "Бірдеңе дұрыс болмады",
    errorBody: "Кешіріңіз, бетті жүктеу кезінде күтпеген қате болды. Қайталап көріңіз. Қате қайталанса, біраздан кейін қайта кіріңіз.",
    retry: "Қайталау",
    home: "Басты бет",
    notFoundLead: "404 — бет",
    notFoundHighlight: "табылмады",
    notFoundBody: "Іздеген бетіңіз жойылған немесе мекенжай қате болуы мүмкін.",
    backHome: "Басты бетке оралу",
  },
  ky: {
    errorTitle: "Бир нерсе туура эмес болду",
    errorBody: "Кечиресиз, баракты жүктөөдө күтүлбөгөн ката кетти. Кайра аракет кылыңыз. Кайталанса, бир аздан кийин кайра кириңиз.",
    retry: "Кайра аракет кылуу",
    home: "Башкы бет",
    notFoundLead: "404 — барак",
    notFoundHighlight: "табылган жок",
    notFoundBody: "Издеген бетиңиз өчүрүлгөн же дарек туура эмес болушу мүмкүн.",
    backHome: "Башкы бетке кайтуу",
  },
  tg: {
    errorTitle: "Чизе нодуруст шуд",
    errorBody: "Бубахшед, ҳангоми боркунии саҳифа хатои ғайричашмдошт рух дод. Дубора кӯшиш кунед. Агар такрор шавад, баъди чанд муддат боз дароед.",
    retry: "Дубора кӯшиш кардан",
    home: "Саҳифаи асосӣ",
    notFoundLead: "404 — саҳифа",
    notFoundHighlight: "ёфт нашуд",
    notFoundBody: "Саҳифаи ҷустуҷӯкардаатон нест карда шудааст ё нишонӣ нодуруст аст.",
    backHome: "Бозгашт ба саҳифаи асосӣ",
  },
};

// In the browser: the language the layout put on <html>; failing that (the
// layout itself crashed) the language cookie, then the phone's own language.
export function browserLocale(): Locale {
  if (typeof document === "undefined") return "uz";
  const fromHtml = document.documentElement.lang;
  if (isLocale(fromHtml)) return fromHtml;
  const cookie = document.cookie.split("; ").find((c) => c.startsWith(`${LOCALE_COOKIE}=`))?.split("=")[1];
  if (isLocale(cookie)) return cookie;
  const phone = (typeof navigator !== "undefined" ? navigator.language : "").slice(0, 2).toLowerCase();
  return isLocale(phone) ? phone : "uz";
}
