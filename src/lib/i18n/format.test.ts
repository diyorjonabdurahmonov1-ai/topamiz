import { describe, expect, it } from "vitest";
import {
  formatCopyright,
  formatItemsCount,
  formatPostSuccessBody,
  formatResultsCount,
  formatTimeAgo,
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
    expect(formatCopyright("en", 2026)).toBe("© 2026 Findo. All rights reserved.");
    expect(formatPostSuccessBody("uz", "yo'qolgan", "Qora hamyon")).toBe(
      "\"Qora hamyon\" e'loni yo'qolgan buyumlar ro'yxatiga qo'shildi."
    );
  });
});

describe("formatTimeAgo", () => {
  const now = Date.parse("2026-10-09T12:00:00Z");
  it("reads SQLite's UTC timestamps and words them per locale", () => {
    expect(formatTimeAgo("uz", "2026-10-09 10:00:00", now)).toBe("2 soat oldin");
    expect(formatTimeAgo("ru", "2026-10-09 11:55:00", now)).toBe("5 минут назад");
    expect(formatTimeAgo("en", "2026-10-08 12:00:00", now)).toBe("yesterday");
  });

  // Written out by hand, not through Intl, whose data in a browser lacks
  // these languages: every one must read in its own language.
  it("words every unit in each of the six languages", () => {
    const ago = (locale: Parameters<typeof formatTimeAgo>[0], createdAt: string) =>
      formatTimeAgo(locale, createdAt, now);
    const fiveMinutes = "2026-10-09 11:55:00";
    const threeDays = "2026-10-06 12:00:00";
    const twoMonths = "2026-08-09 12:00:00";
    const twoYears = "2024-10-09 12:00:00";
    expect(ago("uz", fiveMinutes)).toBe("5 daqiqa oldin");
    expect(ago("uz", threeDays)).toBe("3 kun oldin");
    expect(ago("uz", twoMonths)).toBe("2 oy oldin");
    expect(ago("uz", twoYears)).toBe("2 yil oldin");
    expect(ago("kk", fiveMinutes)).toBe("5 минут бұрын");
    expect(ago("ky", fiveMinutes)).toBe("5 мүнөт мурун");
    expect(ago("tg", threeDays)).toBe("3 рӯз пеш");
    expect(ago("en", fiveMinutes)).toBe("5 minutes ago");
    expect(ago("en", "2026-10-09 11:59:00")).toBe("1 minute ago");
    expect(ago("ru", threeDays)).toBe("3 дня назад");
    expect(ago("ru", twoYears)).toBe("2 года назад");
  });

  it("says 'just now' under a minute and never reads negative", () => {
    expect(formatTimeAgo("uz", "2026-10-09 11:59:40", now)).toBe("hozirgina");
    expect(formatTimeAgo("uz", "2026-10-09 12:00:30", now)).toBe("hozirgina");
    expect(formatTimeAgo("ru", "2026-10-09 11:59:40", now)).toBe("только что");
  });
});
