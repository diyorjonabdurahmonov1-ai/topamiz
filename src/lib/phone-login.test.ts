import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "./db";
import { findOrCreatePhoneUser } from "./auth";
import { checkLoginCode, issueLoginCode, normalizeUzPhone } from "./phone-login";

beforeEach(() => {
  db.exec("DELETE FROM phone_codes; DELETE FROM sessions; DELETE FROM users;");
});
afterEach(() => {
  vi.useRealTimers();
});

describe("normalizeUzPhone", () => {
  it("accepts the ways people type an Uzbek mobile number", () => {
    for (const input of ["90 123 45 67", "901234567", "+998 90 123-45-67", "998901234567", "(90) 123 45 67"]) {
      expect(normalizeUzPhone(input)).toBe("+998901234567");
    }
  });
  it("rejects anything that isn't a 9-digit local number", () => {
    for (const input of ["", "12345", "9012345678", "+7 900 123 45 67", "abc"]) {
      expect(normalizeUzPhone(input)).toBeNull();
    }
  });
});

describe("login codes", () => {
  const phone = "+998901234567";

  it("accepts the right code once, then it's used up", () => {
    const issued = issueLoginCode(phone);
    if (!("code" in issued)) throw new Error("expected a code");
    expect(issued.code).toMatch(/^\d{6}$/);
    expect(checkLoginCode(phone, issued.code)).toBe("ok");
    expect(checkLoginCode(phone, issued.code)).toBe("expired");
  });

  it("enforces a cooldown between sends", () => {
    issueLoginCode(phone);
    const again = issueLoginCode(phone);
    expect("retryAfterSeconds" in again && again.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("locks the code after too many wrong guesses", () => {
    const issued = issueLoginCode(phone);
    if (!("code" in issued)) throw new Error("expected a code");
    const wrong = issued.code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 4; i++) expect(checkLoginCode(phone, wrong)).toBe("wrong");
    expect(checkLoginCode(phone, wrong)).toBe("too-many");
    expect(checkLoginCode(phone, issued.code)).toBe("too-many");
  });

  it("expires codes after 5 minutes", () => {
    vi.useFakeTimers();
    const issued = issueLoginCode(phone);
    if (!("code" in issued)) throw new Error("expected a code");
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(checkLoginCode(phone, issued.code)).toBe("expired");
  });
});

describe("findOrCreatePhoneUser", () => {
  it("creates an account once and finds it again", () => {
    const first = findOrCreatePhoneUser("+998901234567");
    expect(first.name).toBe("Foydalanuvchi 4567");
    expect(findOrCreatePhoneUser("+998901234567").id).toBe(first.id);
  });
});
