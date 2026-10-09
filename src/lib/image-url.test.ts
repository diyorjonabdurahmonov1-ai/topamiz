import { describe, expect, it } from "vitest";
import { sizedImage } from "./image-url";

describe("sizedImage", () => {
  it("asks for a resized copy of our own photos", () => {
    expect(sizedImage("/api/uploads/a.webp", 480)).toBe("/api/uploads/a.webp?w=480");
    expect(sizedImage("/api/uploads/b.JPG", 240)).toBe("/api/uploads/b.JPG?w=240");
  });

  it("leaves everything else alone", () => {
    expect(sizedImage("/api/uploads/c.gif", 480)).toBe("/api/uploads/c.gif");
    expect(sizedImage("/api/uploads/d.mp4", 480)).toBe("/api/uploads/d.mp4");
    expect(sizedImage("https://lh3.googleusercontent.com/x", 240)).toBe("https://lh3.googleusercontent.com/x");
    expect(sizedImage(null, 240)).toBeNull();
  });
});
