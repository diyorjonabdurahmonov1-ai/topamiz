import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "./db";
import { createPhoneUser, getPhoneAccount, hashPassword, setUserPassword, verifyPassword } from "./auth";
import { checkCode, issueCode, normalizeUzPhone, passwordProblem } from "./phone-login";

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

describe("verification codes", () => {
  const phone = "+998901234567";

  function issue(purpose: "register" | "reset" = "register"): string {
    const issued = issueCode(purpose, phone);
    if (!("code" in issued)) throw new Error("expected a code");
    return issued.code;
  }

  it("accepts the right code once, then it's used up", () => {
    const code = issue();
    expect(code).toMatch(/^\d{4}$/);
    expect(checkCode("register", phone, code)).toBe("ok");
    expect(checkCode("register", phone, code)).toBe("expired");
  });

  it("keeps sign-up and reset codes apart", () => {
    const code = issue("register");
    expect(checkCode("reset", phone, code)).toBe("expired");
    expect(checkCode("register", phone, code)).toBe("ok");
  });

  it("enforces a cooldown between sends", () => {
    issue();
    const again = issueCode("register", phone);
    expect("retryAfterSeconds" in again && again.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("locks the code after too many wrong guesses", () => {
    const code = issue();
    const wrong = code === "0000" ? "1111" : "0000";
    for (let i = 0; i < 4; i++) expect(checkCode("register", phone, wrong)).toBe("wrong");
    expect(checkCode("register", phone, wrong)).toBe("too-many");
    expect(checkCode("register", phone, code)).toBe("too-many");
  });

  it("expires codes after 5 minutes", () => {
    vi.useFakeTimers();
    const code = issue();
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(checkCode("register", phone, code)).toBe("expired");
  });
});

describe("passwords", () => {
  it("never stores the password itself and verifies it", () => {
    const stored = hashPassword("secret123");
    expect(stored).not.toContain("secret123");
    expect(verifyPassword("secret123", stored)).toBe(true);
    expect(verifyPassword("secret124", stored)).toBe(false);
    expect(verifyPassword("secret123", null)).toBe(false);
    expect(verifyPassword("secret123", "legacy-format")).toBe(false);
  });

  it("requires 8+ characters with a letter and a digit", () => {
    expect(passwordProblem("short1")).not.toBeNull();
    expect(passwordProblem("onlyletters")).not.toBeNull();
    expect(passwordProblem("12345678")).not.toBeNull();
    expect(passwordProblem("findo2026")).toBeNull();
    expect(passwordProblem("парольчик7")).toBeNull();
  });

  it("creates a phone account with consent recorded, and resets its password", () => {
    const user = createPhoneUser({ phone: "+998901234567", name: "Aziz", password: "findo2026" });
    const account = getPhoneAccount("+998901234567");
    expect(account?.user.id).toBe(user.id);
    expect(verifyPassword("findo2026", account!.passwordHash)).toBe(true);
    const row = db.prepare("SELECT terms_accepted_at FROM users WHERE id = ?").get(user.id) as {
      terms_accepted_at: string | null;
    };
    expect(row.terms_accepted_at).not.toBeNull();

    setUserPassword(user.id, "newpass99");
    expect(verifyPassword("newpass99", getPhoneAccount("+998901234567")!.passwordHash)).toBe(true);
  });
});
