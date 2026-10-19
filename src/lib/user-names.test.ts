import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { createPhoneUser, findOrCreateGoogleUser } from "./auth";
import { nameKey } from "./name-key";
import { isNameConflict, nameProblem, uniqueName } from "./user-names";

beforeEach(() => {
  db.exec("DELETE FROM listing_reports; DELETE FROM listings;");
  db.exec("DELETE FROM sessions; DELETE FROM messages; DELETE FROM tags; DELETE FROM users;");
});

describe("nameKey", () => {
  it("treats case, spacing and apostrophe variants as the same name", () => {
    expect(nameKey("  Aziz   Karimov ")).toBe("aziz karimov");
    expect(nameKey("G‘ofur")).toBe(nameKey("g'ofur"));
    expect(nameKey("Oʻlmas")).toBe(nameKey("O’lmas"));
    expect(nameKey("АЗИЗ")).toBe("азиз");
  });
});

describe("unique profile names", () => {
  it("reports a name someone already has as taken, whatever its spelling", () => {
    const aziz = createPhoneUser({ phone: "+998901110001", name: "Aziz Karimov", password: "Parol12345" });
    expect(nameProblem("aziz  karimov")).toBe("nameTaken");
    expect(nameProblem("Aziz Karimov", { exceptUserId: aziz.id })).toBeNull();
    expect(nameProblem("Aziz Karimov 2")).toBeNull();
    expect(nameProblem("A")).toBe("nameRequired");
    expect(nameProblem("findo")).toBe("nameReserved");
  });

  it("refuses a second account with the same name at the database too", () => {
    createPhoneUser({ phone: "+998901110001", name: "Dilnoza", password: "Parol12345" });
    let caught: unknown;
    try {
      createPhoneUser({ phone: "+998901110002", name: "DILNOZA", password: "Parol12345" });
    } catch (err) {
      caught = err;
    }
    expect(isNameConflict(caught)).toBe(true);
  });

  it("numbers a Google name that's already taken", () => {
    createPhoneUser({ phone: "+998901110001", name: "Bobur", password: "Parol12345" });
    const second = findOrCreateGoogleUser({ googleId: "g-1", email: "b1@example.com", name: "Bobur" });
    const third = findOrCreateGoogleUser({ googleId: "g-2", email: "b2@example.com", name: "bobur" });
    expect(second.name).toBe("Bobur 2");
    expect(third.name).toBe("bobur 3");
    expect(uniqueName("Yangi ism")).toBe("Yangi ism");
  });
});
