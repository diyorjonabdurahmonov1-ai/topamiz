import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  deleteUserAccount,
  findOrCreateGoogleUser,
  getUserByEmail,
  getUserByGoogleId,
  getUserById,
  isAdmin,
  isUserBlocked,
  pickAvatarColor,
} from "./auth";
import { blockUser, unblockUser } from "./admin-users";
import { createListing, setListingStatus } from "./listings";
import { sendMessage } from "./messages";
import { createTag } from "./tags";

beforeEach(() => {
  db.exec(
    "DELETE FROM sessions; DELETE FROM messages; DELETE FROM tags; DELETE FROM listings; DELETE FROM users;"
  );
});

describe("pickAvatarColor", () => {
  it("is deterministic for the same seed", () => {
    expect(pickAvatarColor("aziz@example.com")).toBe(pickAvatarColor("aziz@example.com"));
  });
});

describe("findOrCreateGoogleUser", () => {
  it("creates a new user on first sign-in and can look them up by google id, email, or id", () => {
    const created = findOrCreateGoogleUser({
      googleId: "g-123",
      email: "aziz@example.com",
      name: "Aziz Karimov",
      avatarUrl: "https://lh3.googleusercontent.com/avatar.jpg",
    });

    expect(created.name).toBe("Aziz Karimov");
    expect(created.email).toBe("aziz@example.com");
    expect(created.avatarUrl).toBe("https://lh3.googleusercontent.com/avatar.jpg");

    expect(getUserByGoogleId("g-123")?.id).toBe(created.id);
    expect(getUserByEmail("aziz@example.com")?.id).toBe(created.id);
    expect(getUserById(created.id)?.email).toBe("aziz@example.com");
  });

  it("returns the same user on a repeat sign-in instead of creating a duplicate", () => {
    const first = findOrCreateGoogleUser({ googleId: "g-123", email: "aziz@example.com", name: "Aziz" });
    const second = findOrCreateGoogleUser({ googleId: "g-123", email: "aziz@example.com", name: "Aziz" });

    expect(second.id).toBe(first.id);
    const all = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
    expect(all.c).toBe(1);
  });

  it("links a matching email to a new google id instead of erroring on the unique constraint", () => {
    const first = findOrCreateGoogleUser({ googleId: "g-old", email: "aziz@example.com", name: "Aziz" });
    const relinked = findOrCreateGoogleUser({ googleId: "g-new", email: "aziz@example.com", name: "Aziz" });

    expect(relinked.id).toBe(first.id);
    expect(getUserByGoogleId("g-new")?.id).toBe(first.id);
  });

  it("returns null for a google id or email that doesn't exist", () => {
    expect(getUserByGoogleId("nope")).toBeNull();
    expect(getUserByEmail("nope@example.com")).toBeNull();
  });
});

describe("isAdmin", () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  });

  it("returns false when there is no user or ADMIN_EMAILS is unset", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin({ email: "owner@example.com" })).toBe(false);
  });

  it("matches an email in a comma-separated ADMIN_EMAILS list, case-insensitively", () => {
    process.env.ADMIN_EMAILS = "owner@example.com, Second@Example.com";
    expect(isAdmin({ email: "owner@example.com" })).toBe(true);
    expect(isAdmin({ email: "SECOND@example.com" })).toBe(true);
    expect(isAdmin({ email: "someone-else@example.com" })).toBe(false);
  });
});

describe("isUserBlocked", () => {
  it("reflects blockUser/unblockUser", () => {
    const user = findOrCreateGoogleUser({ googleId: "g-1", email: "aziz@example.com", name: "Aziz" });
    expect(isUserBlocked(user.id)).toBe(false);

    blockUser(user.id);
    expect(isUserBlocked(user.id)).toBe(true);

    unblockUser(user.id);
    expect(isUserBlocked(user.id)).toBe(false);
  });

  it("returns false for a user id that doesn't exist", () => {
    expect(isUserBlocked(999999)).toBe(false);
  });
});

describe("deleteUserAccount", () => {
  it("removes the account and cascades per table, without orphaning other users' data", () => {
    const owner = findOrCreateGoogleUser({ googleId: "g-owner", email: "owner@example.com", name: "Owner" });
    const finder = findOrCreateGoogleUser({ googleId: "g-finder", email: "finder@example.com", name: "Finder" });

    const listing = createListing({
      ownerId: owner.id,
      kind: "lost",
      title: "Qora hamyon",
      description: "test",
      category: "sumka",
      city: "Toshkent",
      reward: 50000,
      contactName: "Owner",
      contactPhone: "+998901234567",
      photoUrls: [],
      country: "UZ",
    });

    sendMessage({ senderId: finder.id, recipientId: owner.id, body: "Men topdim", listingId: Number(listing.id) });
    setListingStatus(listing.id, "resolved", finder.id);
    const tag = createTag({ ownerId: finder.id, title: "Kalit", description: "test", photoUrls: [] });

    // Deleting the finder clears their listings.resolved_by credit (no FK on
    // that column) and cascades their own tag, but the message they sent
    // only loses its sender_id (ON DELETE SET NULL) since the recipient
    // (owner) still exists.
    deleteUserAccount(finder.id);

    expect(getUserById(finder.id)).toBeNull();
    expect(db.prepare("SELECT resolved_by FROM listings WHERE id = ?").get(listing.id)).toEqual({
      resolved_by: null,
    });
    expect(db.prepare("SELECT COUNT(*) c FROM tags WHERE id = ?").get(tag.id)).toEqual({ c: 0 });
    const message = db
      .prepare("SELECT sender_id, recipient_id FROM messages WHERE listing_id = ?")
      .get(listing.id) as { sender_id: number | null; recipient_id: number };
    expect(message.sender_id).toBeNull();
    expect(message.recipient_id).toBe(owner.id);

    // Deleting the owner (the listing's only remaining link) leaves the
    // listing itself in place, just ownerless, and cascades the message
    // where they were the recipient.
    deleteUserAccount(owner.id);

    expect(getUserById(owner.id)).toBeNull();
    expect(db.prepare("SELECT owner_id FROM listings WHERE id = ?").get(listing.id)).toEqual({
      owner_id: null,
    });
    expect(db.prepare("SELECT COUNT(*) c FROM messages WHERE listing_id = ?").get(listing.id)).toEqual({
      c: 0,
    });
  });
});
