// Admin ad uploads accept images and short video clips, unlike the regular
// image-only upload path — kept as its own validator so widening what admin
// can upload never widens what a public listing/QR photo can be.
const SIGNATURES: Record<string, (buf: Buffer) => boolean> = {
  "image/jpeg": (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  "image/png": (buf) =>
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a,
  "image/gif": (buf) =>
    buf.length >= 6 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61,
  "image/webp": (buf) =>
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP",
  "video/mp4": (buf) => buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp",
  "video/webm": (buf) =>
    buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3,
};

export function matchesMediaSignature(buffer: Buffer, mimeType: string): boolean {
  const check = SIGNATURES[mimeType];
  return check ? check(buffer) : false;
}

export function mediaKindFor(mimeType: string): "image" | "video" | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return null;
}
