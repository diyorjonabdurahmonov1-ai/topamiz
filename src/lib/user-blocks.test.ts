import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser } from "./auth";
import { addFriend, isFriend } from "./friends";
import { addComment, getComments } from "./listing-comments";
import { createListing, getAllActiveListings } from "./listings";
import { getConversations, sendMessage, unreadTotal } from "./messages";
import { getNotifications, notify, unreadNotificationCount } from "./notifications";
import {
  blockUserFor,
  dismissUserReports,
  getReportedUsers,
  hasBlocked,
  isBlockedBetween,
  reportUser,
  unblockUserFor,
  withoutBlockedOwners,
} from "./user-blocks";

beforeEach(() => {
  db.exec(
    "DELETE FROM user_reports; DELETE FROM user_blocks; DELETE FROM notifications; DELETE FROM friendships; DELETE FROM sessions; DELETE FROM listing_comments; DELETE FROM messages; DELETE FROM listings; DELETE FROM users;"
  );
});

function user(name: string) {
  return findOrCreateGoogleUser({ googleId: `g-${name}`, email: `${name}@example.com`, name });
}

function listing(ownerId: number) {
  return createListing({
    ownerId,
    kind: "sell",
    title: "Velosiped",
    description: "",
    category: "sport",
    city: "Toshkent",
    reward: null,
    contactName: "X",
    contactPhone: "+998901234567",
    photoUrls: [],
    country: "UZ",
  });
}

describe("one user blocking another", () => {
  it("hides the blocked user's listings, comments, chats and notifications from the blocker only", () => {
    const me = user("me");
    const troll = user("troll");
    const other = user("other");
    const trollsListing = listing(troll.id);
    const mine = listing(me.id);
    addComment({ listingId: Number(mine.id), userId: troll.id, body: "yomon" });
    sendMessage({ senderId: troll.id, recipientId: me.id, body: "salom" });
    notify({ userId: me.id, type: "listing_like", actorId: troll.id, listingId: Number(mine.id) });
    addFriend(me.id, troll.id);

    blockUserFor(me.id, troll.id);

    expect(hasBlocked(me.id, troll.id)).toBe(true);
    expect(isBlockedBetween(troll.id, me.id)).toBe(true);
    expect(isFriend(me.id, troll.id)).toBe(false);
    const feed = withoutBlockedOwners(getAllActiveListings("UZ"), me.id).map((l) => l.id);
    expect(feed).not.toContain(trollsListing.id);
    expect(withoutBlockedOwners(getAllActiveListings("UZ"), other.id).map((l) => l.id)).toContain(trollsListing.id);
    expect(getComments(Number(mine.id), me.id)).toEqual([]);
    expect(getComments(Number(mine.id), other.id)).toHaveLength(1);
    expect(getConversations(me.id)).toEqual([]);
    expect(unreadTotal(me.id)).toBe(0);
    expect(getNotifications(me.id)).toEqual([]);
    expect(unreadNotificationCount(me.id)).toBe(0);

    // No new notifications get through either.
    notify({ userId: me.id, type: "friend_added", actorId: troll.id });
    expect(getNotifications(me.id)).toEqual([]);

    unblockUserFor(me.id, troll.id);
    expect(isBlockedBetween(me.id, troll.id)).toBe(false);
    expect(getConversations(me.id)).toHaveLength(1);
    expect(getComments(Number(mine.id), me.id)).toHaveLength(1);
  });

  it("can't block yourself", () => {
    const me = user("me");
    blockUserFor(me.id, me.id);
    expect(hasBlocked(me.id, me.id)).toBe(false);
  });
});

describe("reporting a user", () => {
  it("collects one report per reporter for the admin, and can be dismissed", () => {
    const troll = user("troll");
    const a = user("a");
    const b = user("b");
    reportUser({ reportedId: troll.id, reporterId: a.id, reason: "haqorat", context: "chat" });
    reportUser({ reportedId: troll.id, reporterId: a.id, reason: "haqorat va spam", context: "chat" });
    reportUser({ reportedId: troll.id, reporterId: b.id, reason: "", context: "profile" });
    expect(reportUser({ reportedId: a.id, reporterId: a.id, reason: "", context: "profile" })).toBe(false);

    const [entry] = getReportedUsers();
    expect(entry.userId).toBe(troll.id);
    expect(entry.reportCount).toBe(2);
    expect(entry.reasons.map((r) => r.text)).toContain("haqorat va spam");

    dismissUserReports(troll.id);
    expect(getReportedUsers()).toEqual([]);
  });
});
