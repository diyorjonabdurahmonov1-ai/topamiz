import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { createUser } from "./auth";
import { countActiveTags, createTag, deleteTag, getTagByCode, getTagsByOwner } from "./tags";

beforeEach(() => {
  db.exec("DELETE FROM sessions; DELETE FROM messages; DELETE FROM tags; DELETE FROM users;");
});

describe("createTag", () => {
  it("generates a unique code and can be looked up by it", () => {
    const owner = createUser("+998901111111", "password123", "Egasi");
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
    const owner = createUser("+998901111111", "password123", "Egasi");
    const first = createTag({ ownerId: owner.id, title: "A", description: "desc", photoUrls: [] });
    const second = createTag({ ownerId: owner.id, title: "B", description: "desc", photoUrls: [] });
    expect(first.code).not.toBe(second.code);
  });
});

describe("countActiveTags / getTagsByOwner", () => {
  it("only counts the given owner's tags", () => {
    const owner = createUser("+998901111111", "password123", "Egasi");
    const other = createUser("+998902222222", "password123", "Boshqa");

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
    const owner = createUser("+998901111111", "password123", "Egasi");
    const attacker = createUser("+998902222222", "password123", "Boshqa");
    const tag = createTag({ ownerId: owner.id, title: "A", description: "desc", photoUrls: [] });

    expect(deleteTag(tag.code, attacker.id)).toBe(false);
    expect(getTagByCode(tag.code)).not.toBeNull();
  });

  it("deletes a tag when the owner matches", () => {
    const owner = createUser("+998901111111", "password123", "Egasi");
    const tag = createTag({ ownerId: owner.id, title: "A", description: "desc", photoUrls: [] });

    expect(deleteTag(tag.code, owner.id)).toBe(true);
    expect(getTagByCode(tag.code)).toBeNull();
  });
});
