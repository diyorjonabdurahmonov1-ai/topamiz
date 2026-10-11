import { describe, expect, it } from "vitest";
import {
  categoriesFor,
  defaultCategory,
  defaultCurrency,
  fieldsFor,
  formatPrice,
  isCategoryAllowed,
  kindHasPrice,
  sanitizeAttrs,
} from "./sections";

describe("sections", () => {
  it("offers the right categories per kind", () => {
    expect(categoriesFor("sell")).toContain("transport");
    expect(categoriesFor("lost")).toContain("hujjatlar");
    expect(isCategoryAllowed("lost", "transport")).toBe(false);
    expect(isCategoryAllowed("sell", "hujjatlar")).toBe(false);
    expect(defaultCategory("job")).toBe("ish");
    expect(defaultCategory("sell")).toBe("boshqa");
  });

  it("prices everything except lost and found", () => {
    expect(kindHasPrice("sell")).toBe(true);
    expect(kindHasPrice("job")).toBe(true);
    expect(kindHasPrice("lost")).toBe(false);
    expect(defaultCurrency("sell", "transport")).toBe("USD");
    expect(defaultCurrency("sell", "texnika")).toBe("UZS");
    expect(defaultCurrency("rent", "kochmas_mulk")).toBe("UZS");
  });

  it("asks for car, property, condition and job fields", () => {
    expect(fieldsFor("sell", "transport").map((f) => f.key)).toEqual(["year", "mileage", "transmission", "fuel"]);
    expect(fieldsFor("rent", "kochmas_mulk").map((f) => f.key)).toContain("rooms");
    expect(fieldsFor("sell", "texnika").map((f) => f.key)).toEqual(["condition"]);
    expect(fieldsFor("sell", "hayvonlar")).toEqual([]);
    expect(fieldsFor("job", "ish").map((f) => f.key)).toEqual(["employment"]);
    expect(fieldsFor("lost", "texnika")).toEqual([]);
  });

  it("keeps only valid, known fields", () => {
    expect(
      sanitizeAttrs("sell", "transport", {
        year: "2019",
        mileage: 85000.4,
        transmission: "avtomat",
        fuel: "plutonium",
        rooms: 3,
        evil: "<script>",
      })
    ).toEqual({ year: 2019, mileage: 85000, transmission: "avtomat" });
    expect(sanitizeAttrs("sell", "transport", { year: 1800 })).toEqual({});
    expect(sanitizeAttrs("sell", "transport", null)).toEqual({});
  });

  it("formats so'm and dollar prices", () => {
    expect(formatPrice(12500, "USD")).toBe("$12 500");
    expect(formatPrice(3500000, "UZS")).toBe("3 500 000 so'm");
  });
});
