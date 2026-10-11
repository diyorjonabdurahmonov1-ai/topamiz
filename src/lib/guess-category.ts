import type { CategoryId } from "./types";

// A best guess at a listing's category from its title, so the post form can
// pre-select the right tile while the poster types ("pasport" → documents,
// "кошелёк" → bags). The poster can always pick another tile; a wrong guess
// costs one tap, a missing one costs nothing.
//
// Each keyword matches the start of a word, so inflected forms still hit
// ("pasportim", "паспорта"). Keywords starting with "=" must be the whole
// word — short ones like "it" (dog) would otherwise match half the language.
const KEYWORDS: [CategoryId, string[]][] = [
  ["transport", [
    "mashina", "avtomobil", "машин", "автомоб", "=avto", "=авто", "=car", "nexia", "cobalt", "gentra", "lacetti",
    "spark", "matiz", "damas", "malibu", "captiva", "tracker", "onix", "monza", "equinox", "chevrolet", "шевроле",
    "kia", "hyundai", "toyota", "byd", "chery", "haval", "lada", "лада", "bmw", "mercedes", "мерседес",
    "mototsikl", "мотоцикл", "skuter", "скутер", "moped", "мопед",
  ]],
  ["kochmas_mulk", [
    "kvartira", "квартир", "xonali", "комнатн", "=uy", "=uyim", "=uyimni", "=uylar", "hovli", "=дом", "=house",
    "apartment", "=flat", "ofis", "офис", "uchastka", "участ", "dacha", "дача", "=yer", "ijaraga", "аренд",
  ]],
  ["uy_rozgor", [
    "mebel", "мебел", "divan", "диван", "=stol", "=stul", "стул", "kreslo", "кресл", "shkaf", "шкаф", "krovat",
    "кроват", "muzlatgich", "холодильн", "gilam", "ковер", "ковёр", "parda", "штор", "sofa", "furniture",
  ]],
  ["bolalar", [
    "kolyaska", "коляск", "bolalar", "детск", "o'yinchoq", "игрушк", "stroller", "=toy", "toys",
  ]],
  ["sport", [
    "velosiped", "велосипед", "bike", "bicycle", "trenajyor", "тренажер", "тренажёр", "gantel", "гантел",
    "samokat", "самокат", "=futbol", "футбол",
  ]],
  ["hujjatlar", [
    "pasport", "passport", "паспорт", "hujjat", "ҳуҷҷат", "документ", "document", "құжат",
    "guvohnoma", "удостоверен", "права", "prava", "diplom", "диплом", "metrika", "метрик",
    "свидетельств", "karta", "карт", "card", "plastik", "пластик", "=id",
  ]],
  ["texnika", [
    "telefon", "телефон", "phone", "iphone", "samsung", "redmi", "xiaomi", "honor", "huawei",
    "airpods", "naushnik", "наушник", "quloqchin", "headphone", "earbud", "planshet", "планшет",
    "tablet", "ipad", "noutbuk", "ноутбук", "laptop", "macbook", "kompyuter", "компьютер",
    "computer", "kamera", "камер", "camera", "zaryad", "заряд", "charger", "powerbank",
    "смартфон", "smartfon", "smartphone", "watch", "смарт", "televizor", "телевизор", "konditsioner",
    "кондиционер", "playstation", "noutbuk",
  ]],
  ["sumka", [
    "sumka", "сумк", "bag", "hamyon", "ҳамён", "кошел", "wallet", "purse", "әмиян", "капчык",
    "ryukzak", "рюкзак", "backpack", "portfel", "портфел", "chamadon", "чемодан", "suitcase",
    "papka", "папк",
  ]],
  ["hayvonlar", [
    "mushuk", "кошк", "=кот", "котен", "котён", "мысық", "мышык", "гурба", "cat", "kitten",
    "=it", "=iti", "=itim", "=itimiz", "собак", "dog", "puppy", "kuchuk", "щен", "күшік",
    "to'tiqush", "попуга", "parrot", "quyon", "кролик", "rabbit", "hayvon", "животн", "pet",
  ]],
  ["kalitlar", [
    "kalit", "ключ", "key", "brelok", "брелок", "кілт", "ачкыч", "калид",
  ]],
  ["kiyim", [
    "kurtka", "куртк", "jacket", "kiyim", "одежд", "киім", "кийим", "либос", "clothes",
    "palto", "пальто", "coat", "shapka", "шапк", "kepka", "кепк", "ko'ylak", "рубашк",
    "shirt", "sharf", "шарф", "scarf", "qo'lqop", "перчат", "glove", "krossovka", "кроссов",
    "sneaker", "shoe", "poyabzal", "обув", "kofta", "кофт", "sviter", "свитер", "sweater",
    "hoodie", "худи", "shim", "брюк", "джинс", "jeans",
  ]],
];

// `allowed` limits the guess to the categories the listing's kind offers:
// "mashina kalitlari" posted as lost is keys, not a car.
export function guessCategory(title: string, allowed?: readonly CategoryId[]): CategoryId | null {
  const words = title
    .toLowerCase()
    .replace(/[ʻʼ‘’`]/g, "'")
    .split(/[^\p{L}\p{N}']+/u)
    .filter(Boolean);
  // The first word that names something wins — "hamyon, ichida pasport" is
  // a lost wallet that happens to hold a passport.
  for (const word of words) {
    for (const [category, keywords] of KEYWORDS) {
      if (allowed && !allowed.includes(category)) continue;
      if (keywords.some((k) => (k.startsWith("=") ? word === k.slice(1) : word.startsWith(k)))) {
        return category;
      }
    }
  }
  return null;
}
