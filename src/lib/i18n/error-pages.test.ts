import { describe, expect, it } from "vitest";
import { ERROR_PAGE_TEXT } from "./error-pages";
import { LOCALES } from "./locales";

describe("error screens", () => {
  it("have every sentence in every language, none left blank", () => {
    const keys = Object.keys(ERROR_PAGE_TEXT.uz).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(ERROR_PAGE_TEXT[locale]).sort()).toEqual(keys);
      for (const [key, text] of Object.entries(ERROR_PAGE_TEXT[locale])) {
        expect(text.trim(), `${locale}.${key}`).not.toBe("");
      }
    }
  });

  it("don't leave another language's sentence in place of a translation", () => {
    for (const locale of LOCALES.filter((l) => l !== "uz")) {
      for (const [key, text] of Object.entries(ERROR_PAGE_TEXT[locale])) {
        expect(text, `${locale}.${key} is still the Uzbek text`).not.toBe(
          ERROR_PAGE_TEXT.uz[key as keyof typeof ERROR_PAGE_TEXT.uz]
        );
      }
    }
  });
});
