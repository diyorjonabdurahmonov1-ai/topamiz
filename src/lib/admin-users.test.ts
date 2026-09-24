import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser } from "./auth";
import { blockUser, countBlockedUsers, countOnlineUsers, countUsers, listUsers, unblockUser } from "./admin-users";

beforeEach(() => {
  db.exec("DELETE FROM sessions; DELETE FROM messages; DELETE FROM tags; DELETE FROM users;");
});

function makeUser(email: string, name: string) {
  return findOrCreateGoogleUser({ googleId: `g-${email}`, email, name });
}

describe("listUsers / countUsers", () => {
  it("lists every user, newest first, and filters by name or email", () => {
    makeUser("aziz@example.com", "Aziz Karimov");
    makeUser("malika@example.com", "Malika Yusupova");

    expect(countUsers()).toBe(2);
    expect(listUsers().map((u) => u.name)).toEqual(["Malika Yusupova", "Aziz Karimov"]);
    expect(listUsers("karimov").map((u) => u.name)).toEqual(["Aziz Karimov"]);
    expect(listUsers("malika@").map((u) => u.email)).toEqual(["malika@example.com"]);
    expect(listUsers("nobody")).toEqual([]);
  });

  it("reports a brand-new user as offline with no last-seen time", () => {
    makeUser("aziz@example.com", "Aziz");
    const [user] = listUsers();
    expect(user.online).toBe(false);
    expect(user.lastSeenAt).toBeNull();
    expect(user.blockedAt).toBeNull();
  });

  it("reports a user as online when last_seen_at is recent", () => {
    const user = makeUser("aziz@example.com", "Aziz");
    db.prepare("UPDATE users SET last_seen_at = datetime('now') WHERE id = ?").run(user.id);
    expect(listUsers().find((u) => u.id === user.id)?.online).toBe(true);
    expect(countOnlineUsers()).toBe(1);
  });

  it("does not count a stale last_seen_at as online", () => {
    const user = makeUser("aziz@example.com", "Aziz");
    db.prepare("UPDATE users SET last_seen_at = datetime('now', '-1 hour') WHERE id = ?").run(user.id);
    expect(listUsers().find((u) => u.id === user.id)?.online).toBe(false);
    expect(countOnlineUsers()).toBe(0);
  });
});

describe("blockUser / unblockUser", () => {
  it("blocks a user, sets blockedAt, and logs out all their sessions", () => {
    const user = makeUser("aziz@example.com", "Aziz");
    db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(
      "tok-1",
      user.id
    );

    expect(blockUser(user.id)).toBe(true);
    expect(listUsers().find((u) => u.id === user.id)?.blockedAt).not.toBeNull();
    expect(countBlockedUsers()).toBe(1);

    const remainingSessions = db.prepare("SELECT COUNT(*) as c FROM sessions WHERE user_id = ?").get(user.id) as {
      c: number;
    };
    expect(remainingSessions.c).toBe(0);
  });

  it("is idempotent — blocking an already-blocked user returns false", () => {
    const user = makeUser("aziz@example.com", "Aziz");
    expect(blockUser(user.id)).toBe(true);
    expect(blockUser(user.id)).toBe(false);
  });

  it("unblocks a user, clearing blockedAt", () => {
    const user = makeUser("aziz@example.com", "Aziz");
    blockUser(user.id);
    expect(unblockUser(user.id)).toBe(true);
    expect(listUsers().find((u) => u.id === user.id)?.blockedAt).toBeNull();
    expect(countBlockedUsers()).toBe(0);
  });

  it("returns false for a user id that doesn't exist", () => {
    expect(blockUser(999999)).toBe(false);
    expect(unblockUser(999999)).toBe(false);
  });
});
