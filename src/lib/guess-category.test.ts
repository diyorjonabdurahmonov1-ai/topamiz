import { describe, expect, it } from "vitest";
import { guessCategory } from "./guess-category";

describe("guessCategory", () => {
  it("recognises common items in Uzbek, Russian and English", () => {
    expect(guessCategory("Qora rangli pasport")).toBe("hujjatlar");
    expect(guessCategory("Ko'k rangli iPhone 13")).toBe("texnika");
    expect(guessCategory("Чёрный кошелёк")).toBe("sumka");
    expect(guessCategory("Lost car keys")).toBe("kalitlar");
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
