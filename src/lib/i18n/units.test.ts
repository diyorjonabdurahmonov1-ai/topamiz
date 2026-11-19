import { describe, expect, it } from "vitest";
import { formatDate, formatSom } from "../data";
import { formatPrice } from "../sections";
import { LOCALES } from "./locales";
import { MONTHS, SUM_WORD } from "./units";

describe("prices and dates in every language", () => {
  it("keeps Uzbek as the default, which the admin pages rely on", () => {
    expect(formatSom(1500000)).toBe("1 500 000 so'm");
    expect(formatDate("2026-10-09")).toBe("09-oktabr");
    expect(formatPrice(3500000, "UZS")).toBe("3 500 000 so'm");
  });

  it("words the sum in the visitor's language", () => {
    expect(formatSom(150000, "ru")).toBe("150 000 сум");
    expect(formatSom(150000, "en")).toBe("150 000 UZS");
    expect(formatSom(150000, "kk")).toBe("150 000 сум");
    expect(formatSom(150000, "ky")).toBe("150 000 сум");
    expect(formatSom(150000, "tg")).toBe("150 000 сӯм");
    expect(formatPrice(2000000, "UZS", "ru")).toBe("2 000 000 сум");
  });

  it("leaves dollars alone", () => {
    for (const locale of LOCALES) expect(formatPrice(12500, "USD", locale)).toBe("$12 500");
  });

  it("names the month in the visitor's language", () => {
    expect(formatDate("2026-10-09", "ru")).toBe("9 октября");
    expect(formatDate("2026-10-09", "en")).toBe("9 Oct");
    expect(formatDate("2026-10-09", "kk")).toBe("9 қазан");
    expect(formatDate("2026-12-31", "tg")).toBe("31 декабр");
  });

  it("has twelve months and a sum word for every language", () => {
    for (const locale of LOCALES) {
      expect(MONTHS[locale]).toHaveLength(12);
      expect(SUM_WORD[locale].length).toBeGreaterThan(0);
    }
  });
});
