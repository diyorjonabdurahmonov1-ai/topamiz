import { beforeEach, describe, expect, it, vi } from "vitest";

const sendNotification = vi.fn(async () => ({}));
vi.mock("web-push", () => ({
  default: {
    sendNotification,
    setVapidDetails: vi.fn(),
    generateVAPIDKeys: () => ({ publicKey: "test-public", privateKey: "test-private" }),
  },
}));

const { db } = await import("./db");
const { findOrCreateGoogleUser } = await import("./auth");
const { createListing } = await import("./listings");
const { saveSubscription } = await import("./push");
const {
  getNotifications,
  markAllNotificationsRead,
  notificationText,
  notify,
  removeNotification,
  unreadNotificationCount,
} = await import("./notifications");

function makeUser(email: string, name: string) {
  return findOrCreateGoogleUser({ googleId: `g-${email}`, email, name });
}

function makeListing(ownerId: number, title: string) {
  return createListing({
    ownerId,
    kind: "lost",
    title,
    description: "test",
    category: "boshqa",
    city: "Toshkent",
    reward: null,
    contactName: "Owner",
    contactPhone: "+998900000000",
    photoUrls: [],
    country: "UZ",
  });
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  sendNotification.mockClear();
  db.exec("DELETE FROM notifications; DELETE FROM push_subscriptions; DELETE FROM listings; DELETE FROM users;");
});

describe("notify", () => {
  it("adds an unread notification with the actor and listing resolved", () => {
    const owner = makeUser("owner@example.com", "Owner");
    const fan = makeUser("fan@example.com", "Malika");
    const listing = makeListing(owner.id, "Qora hamyon");

    notify({ userId: owner.id, type: "listing_comment", actorId: fan.id, listingId: Number(listing.id) });

    const [n] = getNotifications(owner.id);
    expect(n.type).toBe("listing_comment");
    expect(n.actor?.name).toBe("Malika");
    expect(n.actor).not.toHaveProperty("email");
    expect(n.listingTitle).toBe("Qora hamyon");
    expect(unreadNotificationCount(owner.id)).toBe(1);
  });

  it("never notifies someone about their own action", () => {
    const a = makeUser("a@example.com", "A");
    notify({ userId: a.id, type: "friend_added", actorId: a.id });
    expect(getNotifications(a.id)).toEqual([]);
  });

  it("replaces a repeated event instead of stacking duplicates, and can be withdrawn", () => {
    const a = makeUser("a@example.com", "A");
    const b = makeUser("b@example.com", "B");

    notify({ userId: a.id, type: "friend_added", actorId: b.id });
    notify({ userId: a.id, type: "friend_added", actorId: b.id });
    expect(getNotifications(a.id)).toHaveLength(1);

    removeNotification({ userId: a.id, type: "friend_added", actorId: b.id });
    expect(getNotifications(a.id)).toEqual([]);
  });

  it("marks everything read", () => {
    const a = makeUser("a@example.com", "A");
    const b = makeUser("b@example.com", "B");
    notify({ userId: a.id, type: "friend_added", actorId: b.id });

    markAllNotificationsRead(a.id);
    expect(unreadNotificationCount(a.id)).toBe(0);
    expect(getNotifications(a.id)[0].readAt).not.toBeNull();
  });
});

describe("push delivery", () => {
  it("pushes in the language each subscription was made in", async () => {
    const a = makeUser("a@example.com", "A");
    const b = makeUser("b@example.com", "Aziz");
    saveSubscription(a.id, { endpoint: "https://push.example/ru", keys: { p256dh: "k", auth: "x" } }, "ru");
    saveSubscription(a.id, { endpoint: "https://push.example/uz", keys: { p256dh: "k", auth: "x" } }, "uz");

    notify({ userId: a.id, type: "friend_added", actorId: b.id });
    await flush();

    const bodies = sendNotification.mock.calls.map((call) => JSON.parse((call as unknown as [unknown, string])[1]).body);
    expect(bodies.sort()).toEqual(["Aziz sizni do'stlar qatoriga qo'shdi", "Aziz добавил(а) вас в друзья"].sort());
  });

  it("keeps likes out of push but in the feed", async () => {
    const owner = makeUser("owner@example.com", "Owner");
    const fan = makeUser("fan@example.com", "Fan");
    const listing = makeListing(owner.id, "Kalit");
    saveSubscription(owner.id, { endpoint: "https://push.example/1", keys: { p256dh: "k", auth: "x" } }, "uz");

    notify({ userId: owner.id, type: "listing_like", actorId: fan.id, listingId: Number(listing.id) });
    await flush();

    expect(sendNotification).not.toHaveBeenCalled();
    expect(getNotifications(owner.id)).toHaveLength(1);
  });
});

describe("notificationText", () => {
  it("fills in the name and listing title", () => {
    expect(
      notificationText("en", { type: "listing_like", actorName: "Malika", listingTitle: "Black wallet" })
    ).toBe("Malika liked your listing: “Black wallet”");
  });
});
