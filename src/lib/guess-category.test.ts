import { describe, expect, it } from "vitest";
import { guessCategory } from "./guess-category";
import { CATEGORIES_FOR_KIND } from "./sections";

describe("guessCategory", () => {
  it("recognises common items in Uzbek, Russian and English", () => {
    expect(guessCategory("Qora rangli pasport")).toBe("hujjatlar");
    expect(guessCategory("Ko'k rangli iPhone 13")).toBe("texnika");
    expect(guessCategory("Чёрный кошелёк")).toBe("sumka");
    expect(guessCategory("Lost car keys", CATEGORIES_FOR_KIND.lost)).toBe("kalitlar");
    expect(guessCategory("Oq mushukcha")).toBe("hayvonlar");
    expect(guessCategory("Ko‘k sport kurtka")).toBe("kiyim");
  });

  it("matches inflected forms", () => {
    expect(guessCategory("Pasportimni yo'qotdim")).toBe("hujjatlar");
    expect(guessCategory("Нашёл ключи от машины")).toBe("kalitlar");
  });

  it("does not match short keywords inside other words", () => {
    expect(guessCategory("Kitob")).toBeNull();
    expect(guessCategory("Который час")).toBeNull();
    expect(guessCategory("Itim qochib ketdi")).toBe("hayvonlar");
  });

  it("lets the first item named win", () => {
    expect(guessCategory("Hamyon, ichida pasport bor")).toBe("sumka");
  });

  it("returns null when nothing matches", () => {
    expect(guessCategory("")).toBeNull();
    expect(guessCategory("Oltin uzuk")).toBeNull();
  });
});

describe("guessCategory for classifieds", () => {
  it("recognises cars, property, household and kids' items", () => {
    expect(guessCategory("Chevrolet Cobalt 2021, oq rang")).toBe("transport");
    expect(guessCategory("2 xonali kvartira, Chilonzor")).toBe("kochmas_mulk");
    expect(guessCategory("Продаю 3-комнатную квартиру")).toBe("kochmas_mulk");
    expect(guessCategory("Yangi divan sotiladi")).toBe("uy_rozgor");
    expect(guessCategory("Bolalar kolyaskasi")).toBe("bolalar");
    expect(guessCategory("Velosiped Stels")).toBe("sport");
  });

  it("only guesses among the categories allowed for the listing's kind", () => {
    expect(guessCategory("Mashina kalitlari, Chevrolet belgisi bilan", CATEGORIES_FOR_KIND.lost)).toBe("kalitlar");
    expect(guessCategory("Mashina kalitlari")).toBe("transport");
  });
});
