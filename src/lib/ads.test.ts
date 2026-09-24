import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { createAd, deleteAd, getActiveAds, getAdById, getAllAds, setAdActive } from "./ads";

beforeEach(() => {
  db.exec("DELETE FROM ads;");
});

function makeAd(overrides: Partial<Parameters<typeof createAd>[0]> = {}) {
  return createAd({
    mediaUrl: "/api/uploads/ad.jpg",
    mediaType: "image",
    linkUrl: "https://example.com",
    title: "Test reklama",
    ...overrides,
  });
}

describe("createAd / getAdById", () => {
  it("creates an ad and can look it up by id", () => {
    const ad = makeAd();
    expect(getAdById(ad.id)?.linkUrl).toBe("https://example.com");
    expect(ad.active).toBe(true);
  });
});

describe("getActiveAds / getAllAds", () => {
  it("only returns active ads for the public list, but all ads for admin", () => {
    const a = makeAd({ title: "A" });
    const b = makeAd({ title: "B" });
    setAdActive(b.id, false);

    expect(getActiveAds().map((x) => x.title)).toEqual(["A"]);
    expect(getAllAds().map((x) => x.title).sort()).toEqual(["A", "B"]);
    expect(a.id).not.toBe(b.id);
  });

  it("orders ads by creation order (oldest sort_order first)", () => {
    makeAd({ title: "First" });
    makeAd({ title: "Second" });
    expect(getActiveAds().map((x) => x.title)).toEqual(["First", "Second"]);
  });
});

describe("setAdActive", () => {
  it("toggles an ad's visibility", () => {
    const ad = makeAd();
    expect(setAdActive(ad.id, false)).toBe(true);
    expect(getAdById(ad.id)?.active).toBe(false);
    expect(setAdActive(ad.id, true)).toBe(true);
    expect(getAdById(ad.id)?.active).toBe(true);
  });

  it("returns false for an id that doesn't exist", () => {
    expect(setAdActive(999999, true)).toBe(false);
  });
});

describe("deleteAd", () => {
  it("removes an ad", () => {
    const ad = makeAd();
    expect(deleteAd(ad.id)).toBe(true);
    expect(getAdById(ad.id)).toBeNull();
  });

  it("returns false for an id that doesn't exist", () => {
    expect(deleteAd(999999)).toBe(false);
  });
});
