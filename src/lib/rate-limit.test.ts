import { describe, expect, it } from "vitest";
import { getClientIp, rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("allows requests up to the limit and then blocks", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks independent keys separately", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    expect(rateLimit(keyA, 1, 60_000).allowed).toBe(true);
    expect(rateLimit(keyA, 1, 60_000).allowed).toBe(false);
    expect(rateLimit(keyB, 1, 60_000).allowed).toBe(true);
  });

  it("resets once the window has passed", async () => {
    const key = `test-window-${Math.random()}`;
    expect(rateLimit(key, 1, 20).allowed).toBe(true);
    expect(rateLimit(key, 1, 20).allowed).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(rateLimit(key, 1, 20).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("reads the first address from x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then unknown", () => {
    const withRealIp = new Request("http://localhost", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(getClientIp(withRealIp)).toBe("9.9.9.9");

    const withNothing = new Request("http://localhost");
    expect(getClientIp(withNothing)).toBe("unknown");
  });
});
