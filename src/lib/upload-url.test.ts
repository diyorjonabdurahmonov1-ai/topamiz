import { describe, expect, it } from "vitest";
import { isOwnUploadUrl } from "./upload-url";

describe("isOwnUploadUrl", () => {
  it("accepts a file /api/upload returned", () => {
    expect(isOwnUploadUrl("/api/uploads/3f2b9c1e-8a7d-4e21-9b0c-5d6e7f8a9b0c.webp")).toBe(true);
    expect(isOwnUploadUrl("/api/uploads/legacy_photo-1.JPG")).toBe(true);
  });

  it("rejects anything else", () => {
    for (const url of [
      "/api/uploads/../admin/foydalanuvchilar",
      "/api/uploads/a/b.webp",
      "/api/uploads/x.webp?w=480",
      "/api/uploads/x.svg",
      "https://evil.example/x.webp",
      "/api/uploads/",
      42,
      null,
    ]) {
      expect(isOwnUploadUrl(url)).toBe(false);
    }
  });
});
