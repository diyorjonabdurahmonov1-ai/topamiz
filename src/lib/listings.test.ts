import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser } from "./auth";
import {
  createListing,
  deleteListing,
  getAllActiveListings,
  getListingById,
  getListingOwnerId,
  getListingStats,
  getRewardedListings,
  incrementListingViews,
} from "./listings";

beforeEach(() => {
  db.exec("DELETE FROM listing_reports; DELETE FROM listings;");
  db.exec("DELETE FROM sessions; DELETE FROM messages; DELETE FROM tags; DELETE FROM users;");
});

function makeUser(email: string, name: string) {
  return findOrCreateGoogleUser({ googleId: `g-${email}`, email, name });
}

function makeListingParams(overrides: Partial<Parameters<typeof createListing>[0]> = {}) {
  return {
    ownerId: 1,
    kind: "lost" as const,
    title: "Qora hamyon",
    description: "Bozorda yo'qolgan",
    category: "sumka" as const,
    city: "Toshkent",
    reward: null,
    contactName: "Test User",
    contactPhone: "+998901234567",
    photoUrls: [],
    country: "UZ",
    ...overrides,
  };
}

describe("createListing / getListingById", () => {
  it("creates a listing and derives category colors instead of storing them", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const listing = createListing(makeListingParams({ ownerId: owner.id }));

    expect(listing.title).toBe("Qora hamyon");
    expect(listing.status).toBe("active");
    expect(listing.views).toBe(0);
    expect(listing.colorFrom).toBeTruthy();
    expect(listing.colorTo).toBeTruthy();

    const found = getListingById(listing.id);
    expect(found?.id).toBe(listing.id);
    expect(getListingOwnerId(listing.id)).toBe(owner.id);
  });

  it("returns null for an id that doesn't exist or isn't numeric", () => {
    expect(getListingById("999999")).toBeNull();
    expect(getListingById("not-a-number")).toBeNull();
  });
});

describe("getAllActiveListings", () => {
  it("only returns active listings, newest first", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const a = createListing(makeListingParams({ ownerId: owner.id, title: "A" }));
    createListing(makeListingParams({ ownerId: owner.id, title: "B" }));
    db.prepare("UPDATE listings SET status = 'resolved' WHERE id = ?").run(Number(a.id));

    const active = getAllActiveListings("UZ");
    expect(active.map((l) => l.title)).toEqual(["B"]);
  });
});

describe("getRewardedListings", () => {
  it("only returns active listings with a reward, highest first", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    createListing(makeListingParams({ ownerId: owner.id, title: "No reward" }));
    createListing(makeListingParams({ ownerId: owner.id, title: "Small", reward: 100000 }));
    createListing(makeListingParams({ ownerId: owner.id, title: "Big", reward: 500000 }));

    expect(getRewardedListings("UZ").map((l) => l.title)).toEqual(["Big", "Small"]);
  });
});

describe("country segmentation", () => {
  it("only returns listings from the requested country", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    createListing(makeListingParams({ ownerId: owner.id, title: "Uzbek listing", country: "UZ" }));
    createListing(makeListingParams({ ownerId: owner.id, title: "Kazakh listing", country: "KZ" }));

    expect(getAllActiveListings("UZ").map((l) => l.title)).toEqual(["Uzbek listing"]);
    expect(getAllActiveListings("KZ").map((l) => l.title)).toEqual(["Kazakh listing"]);
  });
});

describe("incrementListingViews", () => {
  it("increments the view count", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const listing = createListing(makeListingParams({ ownerId: owner.id }));
    incrementListingViews(listing.id);
    incrementListingViews(listing.id);
    expect(getListingById(listing.id)?.views).toBe(2);
  });
});

describe("deleteListing", () => {
  it("removes a listing", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const listing = createListing(makeListingParams({ ownerId: owner.id }));
    expect(deleteListing(listing.id)).toBe(true);
    expect(getListingById(listing.id)).toBeNull();
  });

  it("returns false for an id that doesn't exist", () => {
    expect(deleteListing("999999")).toBe(false);
  });
});

describe("getListingStats", () => {
  it("counts total and active listings", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const a = createListing(makeListingParams({ ownerId: owner.id }));
    createListing(makeListingParams({ ownerId: owner.id }));
    db.prepare("UPDATE listings SET status = 'resolved' WHERE id = ?").run(Number(a.id));

    expect(getListingStats()).toEqual({ total: 2, active: 1 });
  });
});
