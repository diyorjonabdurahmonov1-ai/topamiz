import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser } from "./auth";
import {
  getConversations,
  getGuestNotifications,
  getThread,
  markAllGuestNotificationsRead,
  markThreadRead,
  searchUsers,
  sendMessage,
  unreadTotal,
} from "./messages";
import { createTag } from "./tags";

beforeEach(() => {
  db.exec("DELETE FROM sessions; DELETE FROM messages; DELETE FROM tags; DELETE FROM users;");
});

function makeUser(email: string, name: string) {
  return findOrCreateGoogleUser({ googleId: `g-${email}`, email, name });
}

describe("direct messaging", () => {
  it("returns messages between two users in order, regardless of who sent them", () => {
    const a = makeUser("aziz@example.com", "Aziz");
    const b = makeUser("malika@example.com", "Malika");

    sendMessage({ senderId: a.id, recipientId: b.id, body: "Salom" });
    sendMessage({ senderId: b.id, recipientId: a.id, body: "Salom, qalaysiz?" });

    const thread = getThread(a.id, b.id);
    expect(thread.map((m) => m.body)).toEqual(["Salom", "Salom, qalaysiz?"]);
  });

  it("does not leak another pair's messages into the thread", () => {
    const a = makeUser("aziz@example.com", "Aziz");
    const b = makeUser("malika@example.com", "Malika");
    const c = makeUser("sardor@example.com", "Sardor");

    sendMessage({ senderId: a.id, recipientId: b.id, body: "A to B" });
    sendMessage({ senderId: a.id, recipientId: c.id, body: "A to C" });

    const thread = getThread(a.id, b.id);
    expect(thread).toHaveLength(1);
    expect(thread[0].body).toBe("A to B");
  });

  it("counts unread messages and clears them once the thread is read", () => {
    const a = makeUser("aziz@example.com", "Aziz");
    const b = makeUser("malika@example.com", "Malika");

    sendMessage({ senderId: a.id, recipientId: b.id, body: "1" });
    sendMessage({ senderId: a.id, recipientId: b.id, body: "2" });

    expect(unreadTotal(b.id)).toBe(2);

    markThreadRead(b.id, a.id);
    expect(unreadTotal(b.id)).toBe(0);
  });

  it("lists conversations sorted by most recent message, with unread counts", () => {
    const a = makeUser("aziz@example.com", "Aziz");
    const b = makeUser("malika@example.com", "Malika");
    const c = makeUser("sardor@example.com", "Sardor");

    sendMessage({ senderId: b.id, recipientId: a.id, body: "Birinchi" });
    sendMessage({ senderId: c.id, recipientId: a.id, body: "Ikkinchi" });

    const conversations = getConversations(a.id);
    expect(conversations).toHaveLength(2);
    expect(conversations[0].otherUser.id).toBe(c.id);
    expect(conversations[0].unreadCount).toBe(1);
    expect(conversations[1].otherUser.id).toBe(b.id);
  });
});

describe("guest (QR tag) messages", () => {
  it("routes an anonymous contact message to the tag owner's guest notifications", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const tag = createTag({
      ownerId: owner.id,
      title: "Kalitlar",
      description: "Qizil breloklik",
      photoUrls: ["/api/uploads/kalitlar.jpg"],
    });

    sendMessage({
      senderId: null,
      recipientId: owner.id,
      body: "Buyumingizni topdim",
      tagId: tag.id,
      guestName: "Topuvchi",
      guestPhone: "+998909998877",
    });

    const notifications = getGuestNotifications(owner.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].guestName).toBe("Topuvchi");
    expect(notifications[0].tagTitle).toBe("Kalitlar");
    expect(notifications[0].tagPhotoUrl).toBe("/api/uploads/kalitlar.jpg");

    expect(unreadTotal(owner.id)).toBe(1);
    markAllGuestNotificationsRead(owner.id);
    expect(unreadTotal(owner.id)).toBe(0);
  });

  it("keeps guest messages out of the direct-conversation list", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    sendMessage({ senderId: null, recipientId: owner.id, body: "Anonim xabar" });

    expect(getConversations(owner.id)).toHaveLength(0);
  });
});

describe("searchUsers", () => {
  it("finds a user by partial name or email, excluding the searcher", () => {
    const a = makeUser("aziz@example.com", "Aziz Karimov");
    makeUser("malika@example.com", "Malika Yusupova");

    const byName = searchUsers("Karimov", a.id);
    expect(byName.map((u) => u.name)).toEqual([]); // Aziz excludes himself, no other Karimov

    const byEmail = searchUsers("malika@", a.id);
    expect(byEmail).toHaveLength(1);
    expect(byEmail[0].name).toBe("Malika Yusupova");
  });

  it("returns nothing for a blank query", () => {
    const a = makeUser("aziz@example.com", "Aziz");
    expect(searchUsers("   ", a.id)).toEqual([]);
  });
});
