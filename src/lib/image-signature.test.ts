import { describe, expect, it } from "vitest";
import { matchesImageSignature } from "./image-signature";

describe("matchesImageSignature", () => {
  it("accepts a real JPEG header", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(matchesImageSignature(buf, "image/jpeg")).toBe(true);
  });

  it("accepts a real PNG header", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(matchesImageSignature(buf, "image/png")).toBe(true);
  });

  it("accepts a real GIF header (GIF89a and GIF87a)", () => {
    const gif89a = Buffer.from("GIF89a", "ascii");
    const gif87a = Buffer.from("GIF87a", "ascii");
    expect(matchesImageSignature(gif89a, "image/gif")).toBe(true);
    expect(matchesImageSignature(gif87a, "image/gif")).toBe(true);
  });

  it("accepts a real WEBP header", () => {
    const buf = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from("WEBP", "ascii"),
    ]);
    expect(matchesImageSignature(buf, "image/webp")).toBe(true);
  });

  it("rejects a text file pretending to be a PNG", () => {
    const buf = Buffer.from("<script>alert(1)</script>", "ascii");
    expect(matchesImageSignature(buf, "image/png")).toBe(false);
  });

  it("rejects a JPEG's bytes when claimed as a different type", () => {
    const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    expect(matchesImageSignature(jpegBytes, "image/png")).toBe(false);
  });

  it("rejects an unsupported mime type outright", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff]);
    expect(matchesImageSignature(buf, "application/pdf")).toBe(false);
  });

  it("rejects a buffer too short to contain a valid signature", () => {
    expect(matchesImageSignature(Buffer.from([0xff]), "image/jpeg")).toBe(false);
  });
});
