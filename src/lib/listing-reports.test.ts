import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser } from "./auth";
import { createListing, getListingById } from "./listings";
import { getReportedListings, reportListing } from "./listing-reports";

beforeEach(() => {
  db.exec("DELETE FROM listing_reports; DELETE FROM listings;");
  db.exec("DELETE FROM sessions; DELETE FROM messages; DELETE FROM tags; DELETE FROM users;");
});

function makeUser(email: string, name: string) {
  return findOrCreateGoogleUser({ googleId: `g-${email}`, email, name });
}

function makeListing(ownerId: number, title = "Test e'lon") {
  return createListing({
    ownerId,
    kind: "lost",
    title,
    description: "desc",
    category: "boshqa",
    city: "Toshkent",
    reward: null,
    contactName: "X",
    contactPhone: "+998900000000",
    photoUrls: [],
  });
}

describe("reportListing", () => {
  it("records a report and does not auto-delete below the threshold", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const reporter = makeUser("reporter@example.com", "Reporter");
    const listing = makeListing(owner.id);

    const result = reportListing(listing.id, reporter.id, "spam");
    expect(result).toEqual({ reported: true, reportCount: 1, autoDeleted: false });
    expect(getListingById(listing.id)).not.toBeNull();
  });

  it("is a no-op if the same user reports the same listing twice", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const reporter = makeUser("reporter@example.com", "Reporter");
    const listing = makeListing(owner.id);

    reportListing(listing.id, reporter.id, "spam");
    const second = reportListing(listing.id, reporter.id, "spam again");
    expect(second).toEqual({ reported: false, reportCount: 1, autoDeleted: false });
  });

  it("auto-deletes the listing once 3 distinct users have reported it", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const a = makeUser("a@example.com", "A");
    const b = makeUser("b@example.com", "B");
    const c = makeUser("c@example.com", "C");
    const listing = makeListing(owner.id);

    expect(reportListing(listing.id, a.id, "").autoDeleted).toBe(false);
    expect(reportListing(listing.id, b.id, "").autoDeleted).toBe(false);
    const third = reportListing(listing.id, c.id, "");
    expect(third).toEqual({ reported: true, reportCount: 3, autoDeleted: true });
    expect(getListingById(listing.id)).toBeNull();
  });
});

describe("getReportedListings", () => {
  it("summarizes report counts and reasons per listing, excluding unreported ones", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const a = makeUser("a@example.com", "A");
    const b = makeUser("b@example.com", "B");
    const reported = makeListing(owner.id, "Reported one");
    makeListing(owner.id, "Untouched one");

    reportListing(reported.id, a.id, "spam");
    reportListing(reported.id, b.id, "haqoratli");

    const summaries = getReportedListings();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].title).toBe("Reported one");
    expect(summaries[0].reportCount).toBe(2);
    expect(summaries[0].reasons.sort()).toEqual(["haqoratli", "spam"]);
  });
});
