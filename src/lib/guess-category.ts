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
    "смартфон", "smartfon", "smartphone", "watch", "смарт",
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

export function guessCategory(title: string): CategoryId | null {
  const words = title
    .toLowerCase()
    .replace(/[ʻʼ‘’`]/g, "'")
    .split(/[^\p{L}\p{N}']+/u)
    .filter(Boolean);
  // The first word that names something wins — "hamyon, ichida pasport" is
  // a lost wallet that happens to hold a passport.
  for (const word of words) {
    for (const [category, keywords] of KEYWORDS) {
      if (keywords.some((k) => (k.startsWith("=") ? word === k.slice(1) : word.startsWith(k)))) {
        return category;
      }
    }
  }
  return null;
}
