import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser } from "./auth";
import {
  addFriend,
  getFollowerCount,
  getFollowers,
  getFriendCount,
  getFriendIdSet,
  getFriends,
  isFriend,
  removeFriend,
} from "./friends";

function makeUser(email: string, name: string) {
  return findOrCreateGoogleUser({ googleId: `g-${email}`, email, name });
}

beforeEach(() => {
  db.exec("DELETE FROM friendships; DELETE FROM users;");
});

describe("friends", () => {
  it("counts an add on both sides: a friend for one, a follower for the other", () => {
    const aziz = makeUser("aziz@example.com", "Aziz");
    const malika = makeUser("malika@example.com", "Malika");

    addFriend(malika.id, aziz.id);

    expect(isFriend(malika.id, aziz.id)).toBe(true);
    expect(getFriendCount(malika.id)).toBe(1);
    expect(getFollowerCount(aziz.id)).toBe(1);
    expect(getFriendCount(aziz.id)).toBe(0);
    expect(getFollowers(aziz.id).map((u) => u.name)).toEqual(["Malika"]);
    expect(getFriends(malika.id).map((u) => u.name)).toEqual(["Aziz"]);
    expect(getFollowers(aziz.id)[0]).not.toHaveProperty("email");
  });

  it("ignores duplicates and self-adds, and removing undoes both counts", () => {
    const aziz = makeUser("aziz@example.com", "Aziz");
    const malika = makeUser("malika@example.com", "Malika");

    addFriend(malika.id, aziz.id);
    addFriend(malika.id, aziz.id);
    addFriend(aziz.id, aziz.id);
    expect(getFollowerCount(aziz.id)).toBe(1);
    expect(getFriendCount(aziz.id)).toBe(0);

    removeFriend(malika.id, aziz.id);
    expect(getFollowerCount(aziz.id)).toBe(0);
    expect(getFriendIdSet(malika.id).size).toBe(0);
  });
});
