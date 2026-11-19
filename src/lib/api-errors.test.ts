import { describe, expect, it } from "vitest";
import { getDictionary, LOCALES } from "./i18n";

const placeholders = (text: string) => (text.match(/\{[a-zA-Z]+\}/g) ?? []).sort().join("");

describe("apiErrors dictionary", () => {
  const uz = getDictionary("uz").apiErrors;

  it("has every message in every language, none left blank", () => {
    for (const locale of LOCALES) {
      const messages = getDictionary(locale).apiErrors;
      expect(Object.keys(messages).sort()).toEqual(Object.keys(uz).sort());
      for (const [key, text] of Object.entries(messages)) {
        expect(text.trim(), `${locale}.${key}`).not.toBe("");
      }
    }
  });

  it("keeps the same {placeholders} in every language", () => {
    for (const locale of LOCALES) {
      for (const [key, text] of Object.entries(getDictionary(locale).apiErrors)) {
        expect(placeholders(text), `${locale}.${key}`).toBe(placeholders(uz[key as keyof typeof uz]));
      }
    }
  });

  it("doesn't leave another language's sentence in place of a translation", () => {
    for (const locale of LOCALES.filter((l) => l !== "uz")) {
      const messages = getDictionary(locale).apiErrors;
      for (const [key, text] of Object.entries(messages)) {
        expect(text, `${locale}.${key} is still the Uzbek text`).not.toBe(uz[key as keyof typeof uz]);
      }
    }
  });
});
