import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { encodeUpload, isVariantWidth, UnreadableImageError } from "./images";

async function phonePhoto(width: number, height: number) {
  // What a phone camera produces: a JPEG lying on its side with an EXIF
  // "rotate 90°" flag, and the GPS position the photo was taken at.
  return sharp({ create: { width, height, channels: 3, background: "#3366cc" } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .withExifMerge({
      IFD0: { Make: "TestPhone" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "41/1 18/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "69/1 14/1 0/1" },
    })
    .toBuffer();
}

describe("encodeUpload", () => {
  it("drops EXIF (GPS included) and stores WebP", async () => {
    const input = await phonePhoto(400, 200);
    const before = await sharp(input).metadata();
    expect(before.exif?.includes(Buffer.from("TestPhone"))).toBe(true);
    expect(before.orientation).toBe(6);

    const meta = await sharp(await encodeUpload(input, false)).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
    expect(meta.xmp).toBeUndefined();
  });

  it("applies the EXIF rotation to the pixels", async () => {
    const meta = await sharp(await encodeUpload(await phonePhoto(400, 200), false)).metadata();
    expect([meta.width, meta.height]).toEqual([200, 400]);
  });

  it("caps the long side at 2048px", async () => {
    const big = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#fff" } }).jpeg().toBuffer();
    const meta = await sharp(await encodeUpload(big, false)).metadata();
    expect([meta.width, meta.height]).toEqual([2048, 1536]);
  });

  it("rejects bytes that aren't an image", async () => {
    await expect(encodeUpload(Buffer.from("not an image"), false)).rejects.toBeInstanceOf(UnreadableImageError);
  });
});

describe("isVariantWidth", () => {
  it("only allows the fixed widths", () => {
    expect(isVariantWidth(480)).toBe(true);
    expect(isVariantWidth(481)).toBe(false);
    expect(isVariantWidth(NaN)).toBe(false);
  });
});
