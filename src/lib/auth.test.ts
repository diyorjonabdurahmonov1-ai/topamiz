import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  createPasswordHash,
  createUser,
  getUserByPhone,
  getUserById,
  getUserPasswordHash,
  normalizePhone,
  pickAvatarColor,
  verifyPassword,
} from "./auth";

beforeEach(() => {
  db.exec("DELETE FROM sessions; DELETE FROM messages; DELETE FROM tags; DELETE FROM users;");
});

describe("normalizePhone", () => {
  it("adds the +998 prefix to a bare 9-digit number", () => {
    expect(normalizePhone("901234567")).toBe("+998901234567");
  });

  it("strips a leading zero before adding the prefix", () => {
    expect(normalizePhone("0901234567")).toBe("+998901234567");
  });

  it("keeps a number that already has the 998 country code", () => {
    expect(normalizePhone("998901234567")).toBe("+998901234567");
  });

  it("normalizes a number with spaces and a plus sign the same way", () => {
    expect(normalizePhone("+998 90 123 45 67")).toBe("+998901234567");
  });
});

describe("password hashing", () => {
  it("verifies the correct password", () => {
    const hash = createPasswordHash("correct-horse-battery-staple");
    expect(verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const hash = createPasswordHash("correct-horse-battery-staple");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces a different hash each time due to random salt", () => {
    const a = createPasswordHash("same-password");
    const b = createPasswordHash("same-password");
    expect(a).not.toBe(b);
    expect(verifyPassword("same-password", a)).toBe(true);
    expect(verifyPassword("same-password", b)).toBe(true);
  });

  it("rejects a malformed stored hash instead of throwing", () => {
    expect(verifyPassword("anything", "not-a-real-hash")).toBe(false);
  });
});

describe("pickAvatarColor", () => {
  it("is deterministic for the same seed", () => {
    expect(pickAvatarColor("+998901234567")).toBe(pickAvatarColor("+998901234567"));
  });
});

describe("user creation", () => {
  it("creates a user and can look them up by phone or id", () => {
    const created = createUser("+998901112233", "password123", "Aziz Karimov");

    const byPhone = getUserByPhone("+998901112233");
    expect(byPhone?.id).toBe(created.id);
    expect(byPhone?.name).toBe("Aziz Karimov");
    expect(byPhone?.isPremium).toBe(false);

    const byId = getUserById(created.id);
    expect(byId?.phone).toBe("+998901112233");
  });

  it("stores a verifiable password hash, not the raw password", () => {
    createUser("+998901112244", "super-secret", "Test User");
    const hash = getUserPasswordHash("+998901112244");
    expect(hash).not.toBeNull();
    expect(hash).not.toContain("super-secret");
    expect(verifyPassword("super-secret", hash!)).toBe(true);
  });

  it("returns null for a phone number that doesn't exist", () => {
    expect(getUserByPhone("+998900000000")).toBeNull();
  });
});
