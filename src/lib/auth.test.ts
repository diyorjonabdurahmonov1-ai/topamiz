import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  findOrCreateGoogleUser,
  getUserByEmail,
  getUserByGoogleId,
  getUserById,
  isAdmin,
  pickAvatarColor,
} from "./auth";

beforeEach(() => {
  db.exec("DELETE FROM sessions; DELETE FROM messages; DELETE FROM tags; DELETE FROM users;");
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
