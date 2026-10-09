import { describe, expect, it } from "vitest";
import { smartSearch } from "./ai";
import type { Listing } from "./types";

function makeListing(overrides: Partial<Listing>): Listing {
  return {
    id: "1",
    ownerId: null,
    ownerName: null,
    ownerAvatarColor: null,
    ownerAvatarUrl: null,
    isMysteryBox: false,
    isPromo: false,
    createdAt: "2026-01-01 10:00:00",
    promoCategory: null,
    expiresAt: null,
    startsAt: null,
    resolvedById: null,
    resolvedByName: null,
    resolvedByAvatarColor: null,
    resolvedByAvatarUrl: null,
    kind: "found",
    title: "",
    description: "",
    category: "texnika",
    city: "Toshkent",
    date: "2026-09-01",
    contactName: "Test",
    contactPhone: "+998900000000",
    status: "active",
    colorFrom: "#000",
    colorTo: "#fff",
    views: 0,
    photoUrls: [],
    videoUrl: null,
    videoThumbnailUrl: null,
    likeCount: 0,
    commentCount: 0,
    country: "UZ",
    lat: 41.3,
    lng: 69.2,
    ...overrides,
  };
}

describe("smartSearch", () => {
  it("matches a common Uzbek spelling variant (telefon vs telifon)", () => {
    const listings = [makeListing({ id: "1", title: "Qora rangli telifon" })];
    expect(smartSearch("telefon", listings)).toHaveLength(1);
  });

  it("still matches an exact word", () => {
    const listings = [makeListing({ id: "1", title: "Qora rangli telefon" })];
    expect(smartSearch("telefon", listings)).toHaveLength(1);
  });

  it("matches a plural/suffixed form via substring", () => {
    const listings = [makeListing({ id: "1", description: "Eski telefonlar to'plami" })];
    expect(smartSearch("telefon", listings)).toHaveLength(1);
  });

  it("does not match a genuinely unrelated word", () => {
    const listings = [makeListing({ id: "1", title: "Qora rangli hamyon" })];
    expect(smartSearch("telefon", listings)).toHaveLength(0);
  });

  it("ranks an exact match above a fuzzy one", () => {
    const exact = makeListing({ id: "1", title: "Telefon" });
    const fuzzy = makeListing({ id: "2", title: "Telifon" });
    const results = smartSearch("telefon", [fuzzy, exact]);
    expect(results.map((l) => l.id)).toEqual(["1", "2"]);
  });

  it("returns the full pool for an empty/whitespace query", () => {
    const listings = [makeListing({ id: "1" }), makeListing({ id: "2" })];
    expect(smartSearch("   ", listings)).toHaveLength(2);
  });
});
