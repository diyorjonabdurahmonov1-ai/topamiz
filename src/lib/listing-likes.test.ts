import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser } from "./auth";
import { createListing } from "./listings";
import { getLikeCount, getLikedListingIds, isLikedByUser, toggleLike } from "./listing-likes";

beforeEach(() => {
  db.exec("DELETE FROM listings; DELETE FROM sessions; DELETE FROM users;");
});

function makeListingAndUser() {
  const owner = findOrCreateGoogleUser({ googleId: "g-owner", email: "owner@example.com", name: "Owner" });
  const liker = findOrCreateGoogleUser({ googleId: "g-liker", email: "liker@example.com", name: "Liker" });
  const listing = createListing({
    ownerId: owner.id,
    kind: "found",
    title: "Test",
    description: "test",
    category: "boshqa",
    city: "Toshkent",
    reward: null,
    contactName: "Owner",
    contactPhone: "+998900000000",
    photoUrls: [],
    country: "UZ",
  });
  return { owner, liker, listing };
}

describe("toggleLike", () => {
  it("likes then unlikes, flipping the count and liked state each time", () => {
    const { liker, listing } = makeListingAndUser();
    const id = Number(listing.id);

    expect(isLikedByUser(id, liker.id)).toBe(false);

    const liked = toggleLike(id, liker.id);
    expect(liked).toEqual({ liked: true, count: 1 });
    expect(isLikedByUser(id, liker.id)).toBe(true);
    expect(getLikeCount(id)).toBe(1);

    const unliked = toggleLike(id, liker.id);
    expect(unliked).toEqual({ liked: false, count: 0 });
    expect(isLikedByUser(id, liker.id)).toBe(false);
  });

  it("counts likes from multiple users independently", () => {
    const { liker, listing } = makeListingAndUser();
    const other = findOrCreateGoogleUser({ googleId: "g-other", email: "other@example.com", name: "Other" });
    const id = Number(listing.id);

    toggleLike(id, liker.id);
    toggleLike(id, other.id);
    expect(getLikeCount(id)).toBe(2);
  });
});

describe("getLikedListingIds", () => {
  it("returns only the ids the given user actually liked", () => {
    const { liker, listing } = makeListingAndUser();
    const id = Number(listing.id);
    toggleLike(id, liker.id);

    expect(getLikedListingIds(liker.id, [id, 99999])).toEqual(new Set([id]));
  });
});
