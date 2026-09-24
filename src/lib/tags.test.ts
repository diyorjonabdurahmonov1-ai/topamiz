import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { findOrCreateGoogleUser } from "./auth";
import {
  countActiveTags,
  createTag,
  deleteTag,
  getTagByCode,
  getTagsByOwner,
  setTagStatus,
} from "./tags";

beforeEach(() => {
  db.exec("DELETE FROM sessions; DELETE FROM messages; DELETE FROM tags; DELETE FROM users;");
});

function makeUser(email: string, name: string) {
  return findOrCreateGoogleUser({ googleId: `g-${email}`, email, name });
}

describe("createTag", () => {
  it("generates a unique code and can be looked up by it", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const tag = createTag({
      ownerId: owner.id,
      title: "Uy kalitlari",
      description: "Qizil breloklik",
      photoUrls: ["/api/uploads/abc.jpg"],
    });

    expect(tag.code).toMatch(/^[0-9a-f]+$/);
    const found = getTagByCode(tag.code);
    expect(found?.id).toBe(tag.id);
    expect(found?.title).toBe("Uy kalitlari");
    expect(found?.photoUrls).toEqual(["/api/uploads/abc.jpg"]);
    expect(found?.status).toBe("active");
  });

  it("gives each tag a distinct code even for the same owner", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const first = createTag({ ownerId: owner.id, title: "A", description: "desc", photoUrls: [] });
    const second = createTag({ ownerId: owner.id, title: "B", description: "desc", photoUrls: [] });
    expect(first.code).not.toBe(second.code);
  });
});

describe("countActiveTags / getTagsByOwner", () => {
  it("only counts the given owner's tags", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const other = makeUser("boshqa@example.com", "Boshqa");

    createTag({ ownerId: owner.id, title: "A", description: "desc", photoUrls: [] });
    createTag({ ownerId: owner.id, title: "B", description: "desc", photoUrls: [] });
    createTag({ ownerId: other.id, title: "C", description: "desc", photoUrls: [] });

    expect(countActiveTags(owner.id)).toBe(2);
    expect(getTagsByOwner(owner.id)).toHaveLength(2);
    expect(countActiveTags(other.id)).toBe(1);
  });
});

describe("deleteTag", () => {
  it("refuses to delete a tag belonging to a different owner", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const attacker = makeUser("boshqa@example.com", "Boshqa");
    const tag = createTag({ ownerId: owner.id, title: "A", description: "desc", photoUrls: [] });

    expect(deleteTag(tag.code, attacker.id)).toBe(false);
    expect(getTagByCode(tag.code)).not.toBeNull();
  });

  it("deletes a tag when the owner matches", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const tag = createTag({ ownerId: owner.id, title: "A", description: "desc", photoUrls: [] });

    expect(deleteTag(tag.code, owner.id)).toBe(true);
    expect(getTagByCode(tag.code)).toBeNull();
  });
});

describe("setTagStatus", () => {
  it("marks a tag resolved and back to active when the owner matches", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const tag = createTag({ ownerId: owner.id, title: "A", description: "desc", photoUrls: [] });

    expect(setTagStatus(tag.code, owner.id, "resolved")).toBe(true);
    expect(getTagByCode(tag.code)?.status).toBe("resolved");
    expect(countActiveTags(owner.id)).toBe(0);

    expect(setTagStatus(tag.code, owner.id, "active")).toBe(true);
    expect(getTagByCode(tag.code)?.status).toBe("active");
    expect(countActiveTags(owner.id)).toBe(1);
  });

  it("refuses to change status for a tag belonging to a different owner", () => {
    const owner = makeUser("egasi@example.com", "Egasi");
    const attacker = makeUser("boshqa@example.com", "Boshqa");
    const tag = createTag({ ownerId: owner.id, title: "A", description: "desc", photoUrls: [] });

    expect(setTagStatus(tag.code, attacker.id, "resolved")).toBe(false);
    expect(getTagByCode(tag.code)?.status).toBe("active");
  });
});
