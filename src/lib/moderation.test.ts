import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser, isUserBlocked } from "./auth";
import { containsProhibitedContent, findProhibitedTerm, recordModerationViolation } from "./moderation";

beforeEach(() => {
  db.exec("DELETE FROM sessions; DELETE FROM messages; DELETE FROM tags; DELETE FROM users;");
});

describe("containsProhibitedContent / findProhibitedTerm", () => {
  it("flags text containing a banned term, case- and punctuation-insensitively", () => {
    expect(containsProhibitedContent("Bu FUCK sizga")).toBe(true);
    expect(findProhibitedTerm("Bu, fuck! sizga")).toBe("fuck");
  });

  it("does not flag ordinary lost-and-found text", () => {
    expect(containsProhibitedContent("Qora rangli hamyon, Chilonzor metrosi yaqinida yo'qoldi")).toBe(
      false
    );
    expect(findProhibitedTerm("iPhone 13, ko'k rangli, ekran himoyasi bilan")).toBeNull();
  });
});

describe("recordModerationViolation", () => {
  it("increments strikes and does not block on the first violation", () => {
    const user = findOrCreateGoogleUser({ googleId: "g-1", email: "aziz@example.com", name: "Aziz" });
    const result = recordModerationViolation(user.id);
    expect(result).toEqual({ strikes: 1, blocked: false });
    expect(isUserBlocked(user.id)).toBe(false);
  });

  it("blocks the account on the second violation", () => {
    const user = findOrCreateGoogleUser({ googleId: "g-1", email: "aziz@example.com", name: "Aziz" });
    recordModerationViolation(user.id);
    const second = recordModerationViolation(user.id);
    expect(second).toEqual({ strikes: 2, blocked: true });
    expect(isUserBlocked(user.id)).toBe(true);
  });
});
