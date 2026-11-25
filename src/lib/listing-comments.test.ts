import { beforeEach, describe, expect, it } from "vitest";

const { db } = await import("./db");
const { findOrCreateGoogleUser } = await import("./auth");
const { createListing } = await import("./listings");
const { addComment, getComments, getCommentCount } = await import("./listing-comments");
const { notify, getNotifications, notificationText } = await import("./notifications");

function makeUser(email: string, name: string) {
  return findOrCreateGoogleUser({ googleId: `g-${email}`, email, name });
}

beforeEach(() => {
  db.exec("DELETE FROM notifications; DELETE FROM listing_comments; DELETE FROM listings; DELETE FROM users;");
});

describe("comment replies", () => {
  it("keeps a reply under its top-level comment and names who it answers", () => {
    const owner = makeUser("o@example.com", "Owner");
    const asker = makeUser("a@example.com", "Diyor");
    const listing = createListing({
      ownerId: owner.id, kind: "sell", title: "Telefon", description: "x", category: "texnika", city: "Toshkent",
      reward: null, contactName: "O", contactPhone: "+998900000000", photoUrls: [], country: "UZ",
    });
    const lid = Number(listing.id);
    const top = addComment({ listingId: lid, userId: asker.id, body: "Narxi qancha?" });
    const reply = addComment({ listingId: lid, userId: owner.id, body: "100 dollar", parentId: top.id, replyToUserId: asker.id });

    expect(top.parentId).toBeNull();
    expect(reply.parentId).toBe(top.id);
    expect(reply.replyToName).toBe("Diyor");
    expect(getComments(lid).map((c) => c.id)).toEqual([top.id, reply.id]);
    expect(getCommentCount(lid)).toBe(2);

    // Deleting the top-level comment takes its replies with it.
    db.prepare("DELETE FROM listing_comments WHERE id = ?").run(top.id);
    expect(getComments(lid)).toEqual([]);
  });

  it("tells the person who was answered, in their language", () => {
    const owner = makeUser("o@example.com", "Owner");
    const asker = makeUser("a@example.com", "Diyor");
    notify({ userId: asker.id, type: "comment_reply", actorId: owner.id });
    const [n] = getNotifications(asker.id);
    expect(n.type).toBe("comment_reply");
    expect(notificationText("uz", { type: n.type, actorName: "Owner", listingTitle: "Telefon" })).toBe(
      "Owner izohingizga javob yozdi: «Telefon»"
    );
  });
});
