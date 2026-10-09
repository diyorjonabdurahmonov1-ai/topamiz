import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  cleanPath,
  countRecentErrorGroups,
  deleteErrorGroup,
  fingerprintFor,
  getErrorGroups,
  pruneErrors,
  recordError,
} from "./error-log";

beforeEach(() => {
  db.exec("DELETE FROM app_errors");
});

describe("fingerprintFor", () => {
  it("groups the same bug even when numbers and ids differ", () => {
    expect(fingerprintFor("client", "Loading chunk 4817 failed")).toBe(fingerprintFor("client", "Loading chunk 22 failed"));
    expect(fingerprintFor("client", 'Listing "abc" not found')).toBe(fingerprintFor("client", 'Listing "xyz" not found'));
  });

  it("keeps different bugs and different kinds apart", () => {
    expect(fingerprintFor("client", "a is undefined")).not.toBe(fingerprintFor("client", "b is undefined"));
    expect(fingerprintFor("client", "boom")).not.toBe(fingerprintFor("server", "boom"));
    expect(fingerprintFor("client", "boom", "at A.tsx")).not.toBe(fingerprintFor("client", "boom", "at B.tsx"));
  });
});

describe("cleanPath", () => {
  it("drops the query string and origin", () => {
    expect(cleanPath("https://findo.net.uz/elonlar?q=pasport&token=1")).toBe("/elonlar");
    expect(cleanPath("/reels?x=1")).toBe("/reels");
  });
});

describe("error groups", () => {
  it("groups occurrences, counts users and keeps the latest details", () => {
    recordError({ kind: "client", message: "x is null", path: "/a", userAgent: "UA1", userId: 1, detail: "old" });
    recordError({ kind: "client", message: "x is null", path: "/b", userAgent: "UA2", userId: 2, detail: "new" });
    recordError({ kind: "client", message: "x is null", path: "/b", userAgent: "UA2", userId: 2 });
    recordError({ kind: "server", message: "db locked", path: "/api/x" });
    const groups = getErrorGroups();
    expect(groups).toHaveLength(2);
    const client = groups.find((g) => g.kind === "client")!;
    expect(client).toMatchObject({ count: 3, users: 2 });
    expect(client.paths.sort()).toEqual(["/a", "/b"]);
    expect(countRecentErrorGroups()).toBe(2);

    expect(deleteErrorGroup(client.fingerprint)).toBe(true);
    expect(getErrorGroups()).toHaveLength(1);
  });

  it("forgets errors older than 30 days", () => {
    recordError({ kind: "client", message: "old" });
    db.exec("UPDATE app_errors SET created_at = datetime('now', '-31 days')");
    recordError({ kind: "client", message: "new" });
    pruneErrors();
    expect(getErrorGroups().map((g) => g.message)).toEqual(["new"]);
  });
});
