import { describe, expect, it } from "vitest";
import {
  formatCopyright,
  formatItemsCount,
  formatPostSuccessBody,
  formatResultsCount,
  formatViewsCount,
} from "./format";

describe("formatItemsCount", () => {
  it("applies Russian plural rules", () => {
    expect(formatItemsCount("ru", 1)).toBe("1 объявление");
    expect(formatItemsCount("ru", 2)).toBe("2 объявления");
    expect(formatItemsCount("ru", 5)).toBe("5 объявлений");
    expect(formatItemsCount("ru", 11)).toBe("11 объявлений");
  });

  it("applies English singular/plural", () => {
    expect(formatItemsCount("en", 1)).toBe("1 listing");
    expect(formatItemsCount("en", 2)).toBe("2 listings");
  });

  it("uses a fixed form for uz/kk/tg/ky", () => {
    expect(formatItemsCount("uz", 3)).toBe("3 ta e'lon");
    expect(formatItemsCount("kk", 3)).toBe("3 хабарландыру");
  });
});

describe("formatResultsCount / formatViewsCount", () => {
  it("interpolates the count for each locale", () => {
    expect(formatResultsCount("en", 4)).toBe("4 listings found");
    expect(formatViewsCount("ru", 1)).toBe("1 просмотр");
    expect(formatViewsCount("ru", 3)).toBe("3 просмотра");
  });
});

describe("formatCopyright / formatPostSuccessBody", () => {
  it("builds the expected sentence per locale", () => {
    expect(formatCopyright("en", 2026)).toBe("© 2026 Topamiz. All rights reserved.");
    expect(formatPostSuccessBody("uz", "yo'qolgan", "Qora hamyon")).toBe(
      "\"Qora hamyon\" e'loni yo'qolgan buyumlar ro'yxatiga qo'shildi."
    );
  });
});
