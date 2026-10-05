import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser } from "./auth";
import { createListing } from "./listings";
import { addComment, getCommentCount, getComments } from "./listing-comments";

beforeEach(() => {
  db.exec("DELETE FROM listings; DELETE FROM sessions; DELETE FROM users;");
});

describe("addComment / getComments", () => {
  it("stores comments in order and resolves the commenter's identity", () => {
    const owner = findOrCreateGoogleUser({ googleId: "g-owner", email: "owner@example.com", name: "Owner" });
    const commenter = findOrCreateGoogleUser({
      googleId: "g-commenter",
      email: "commenter@example.com",
      name: "Commenter",
    });
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
    const id = Number(listing.id);

    addComment({ listingId: id, userId: commenter.id, body: "Birinchi izoh" });
    addComment({ listingId: id, userId: owner.id, body: "Ikkinchi izoh" });

    const comments = getComments(id);
    expect(comments.map((c) => c.body)).toEqual(["Birinchi izoh", "Ikkinchi izoh"]);
    expect(comments[0].userName).toBe("Commenter");
    expect(getCommentCount(id)).toBe(2);
  });

  it("returns an empty list for a listing with no comments", () => {
    expect(getComments(999999)).toEqual([]);
    expect(getCommentCount(999999)).toBe(0);
  });
});
