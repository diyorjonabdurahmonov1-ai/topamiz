import { describe, expect, it } from "vitest";
import { mapSectionOf, mapSections } from "./map-sections";

const l = (kind: string, category: string, extra: { isPromo?: boolean; isMysteryBox?: boolean } = {}) =>
  ({ kind, category, isPromo: false, isMysteryBox: false, ...extra }) as Parameters<typeof mapSectionOf>[0];

describe("map sections", () => {
  it("puts every listing in exactly one section", () => {
    expect(mapSectionOf(l("lost", "texnika"))).toBe("lost");
    expect(mapSectionOf(l("found", "kalitlar"))).toBe("found");
    expect(mapSectionOf(l("rent", "kochmas_mulk"))).toBe("rent");
    expect(mapSectionOf(l("sell", "texnika"))).toBe("cat:texnika");
    expect(mapSectionOf(l("job", "ish"))).toBe("cat:ish");
    expect(mapSectionOf(l("sell", "boshqa", { isPromo: true }))).toBe("promo");
    expect(mapSectionOf(l("lost", "boshqa", { isMysteryBox: true }))).toBe("mystery");
  });

  it("lists only the sections present, lost & found first, with counts", () => {
    const result = mapSections([
      l("sell", "transport"),
      l("rent", "kochmas_mulk"),
      l("sell", "kochmas_mulk"),
      l("found", "hujjatlar"),
      l("lost", "texnika"),
      l("lost", "sumka"),
      l("sell", "transport"),
    ]);
    expect(result).toEqual([
      { section: "lost", count: 2 },
      { section: "found", count: 1 },
      { section: "cat:transport", count: 2 },
      { section: "cat:kochmas_mulk", count: 1 },
      { section: "rent", count: 1 },
    ]);
  });
});
