import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser, getPublicUserById } from "./auth";
import { blockUser, unblockUser } from "./admin-users";
import { addComment, getComments } from "./listing-comments";
import { createListing, getAllActiveListings, getAllListingsForAdmin, getListingById } from "./listings";
import { getConversations, searchUsers, sendMessage, unreadTotal } from "./messages";
import { createTag, getTagByCode } from "./tags";

beforeEach(() => {
  db.exec(
    "DELETE FROM sessions; DELETE FROM listing_comments; DELETE FROM messages; DELETE FROM tags; DELETE FROM listings; DELETE FROM users;"
  );
});

function makeListing(ownerId: number) {
  return createListing({
    ownerId,
    kind: "sell",
    title: "Cobalt 2021",
    description: "",
    category: "transport",
    city: "Toshkent",
    reward: null,
    contactName: "Ali",
    contactPhone: "+998901234567",
    photoUrls: [],
    country: "UZ",
  });
}

describe("a blocked user disappears from the site", () => {
  it("hides their listings, tags, profile, comments and chats until unblocked", () => {
    const spammer = findOrCreateGoogleUser({ googleId: "g-spam", email: "spam@example.com", name: "Spammer" });
    const viewer = findOrCreateGoogleUser({ googleId: "g-view", email: "view@example.com", name: "Viewer" });
    const theirs = makeListing(spammer.id);
    const mine = makeListing(viewer.id);
    const tag = createTag({ ownerId: spammer.id, title: "Kalit", description: "x", photoUrls: [] });
    addComment({ listingId: Number(mine.id), userId: spammer.id, body: "Arzon beraman" });
    sendMessage({ senderId: spammer.id, recipientId: viewer.id, body: "Salom" });

    blockUser(spammer.id);

    expect(getAllActiveListings("UZ").map((l) => l.id)).toEqual([mine.id]);
    expect(getListingById(theirs.id)).toBeNull();
    expect(getListingById(theirs.id, { includeHidden: true })?.ownerBlocked).toBe(true);
    expect(getAllListingsForAdmin().map((l) => l.id).sort()).toEqual([mine.id, theirs.id].sort());
    expect(getTagByCode(tag.code)).toBeNull();
    expect(getPublicUserById(spammer.id)).toBeNull();
    expect(searchUsers("Spam", viewer.id)).toEqual([]);
    expect(getComments(Number(mine.id))).toEqual([]);
    expect(getConversations(viewer.id)).toEqual([]);
    expect(unreadTotal(viewer.id)).toBe(0);

    unblockUser(spammer.id);

    expect(getAllActiveListings("UZ")).toHaveLength(2);
    expect(getTagByCode(tag.code)).not.toBeNull();
    expect(getComments(Number(mine.id))).toHaveLength(1);
    expect(unreadTotal(viewer.id)).toBe(1);
  });
});
