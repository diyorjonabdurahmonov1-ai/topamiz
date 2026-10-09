import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { getActivity, getDailyActivity } from "./admin-stats";

beforeEach(() => {
  db.exec("DELETE FROM messages; DELETE FROM listings; DELETE FROM sessions; DELETE FROM users;");
});

// Rows created `daysAgo` days back (0 = just now).
function addUser(daysAgo: number) {
  db.prepare(
    "INSERT INTO users (email, name, avatar_color, created_at) VALUES (?, 'U', '#000', datetime('now', ?))"
  ).run(`${Math.random()}@x.uz`, `-${daysAgo} days`);
}

function addListing(daysAgo: number, status = "active") {
  db.prepare(
    `INSERT INTO listings (kind, title, description, category, city, contact_name, contact_phone, status, created_at)
     VALUES ('lost', 't', '', 'boshqa', 'Toshkent', 'n', '', ?, datetime('now', ?))`
  ).run(status, `-${daysAgo} days`);
}

describe("admin activity stats", () => {
  it("counts today and the last 7 days in Tashkent time", () => {
    addUser(0);
    addUser(3);
    addUser(30);
    addListing(30, "resolved");
    const a = getActivity();
    expect(a.users).toEqual({ today: 1, week: 2 });
    expect(a.listings).toEqual({ today: 0, week: 0 });
    expect(a.resolved).toBe(1);
  });

  it("returns seven days with gaps filled", () => {
    addUser(0);
    const days = getDailyActivity();
    expect(days).toHaveLength(7);
    expect(days.at(-1)?.users).toBe(1);
    expect(days.slice(0, 6).every((d) => d.users === 0 && d.listings === 0)).toBe(true);
  });
});
