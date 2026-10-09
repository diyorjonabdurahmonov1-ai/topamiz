import { mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

// Server-side image handling for /.uploads. Every photo is re-encoded here,
// which does three things at once: it drops all metadata (above all the GPS
// position phones write into EXIF — a lost-and-found site must never publish
// where someone lives), it applies the EXIF rotation to the pixels so the
// photo still shows the right way up, and it caps the size at what a screen
// can use. The browser already does much of this (lib/image-prepare.ts), but
// a client is never trusted to have done it.

export const UPLOAD_DIR = path.join(process.cwd(), ".uploads");
// Resized copies for cards and avatars. Regenerable from the originals at
// any time, so it lives outside .uploads and isn't part of backups.
const VARIANT_DIR = path.join(process.cwd(), ".cache", "uploads");

const MAX_SIDE = 2048;
// The widths pages may ask for — a fixed set, so nobody can fill the disk by
// requesting every width from 1 to 2048.
export const VARIANT_WIDTHS = [240, 480, 960] as const;
export type VariantWidth = (typeof VARIANT_WIDTHS)[number];

const RESIZABLE = new Set(["jpg", "jpeg", "png", "webp"]);

export class UnreadableImageError extends Error {}

// A new upload, whatever it came in as, is stored as WebP: smallest of the
// formats every current browser shows, and it keeps a GIF's animation.
export async function encodeUpload(input: Buffer, animated: boolean): Promise<Buffer> {
  try {
    return await sharp(input, { animated })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new UnreadableImageError();
  }
}

async function writeAtomically(target: string, data: Buffer) {
  const tmp = `${target}.${crypto.randomUUID()}.tmp`;
  await writeFile(tmp, data);
  await rename(tmp, target);
}

export async function saveUpload(data: Buffer, ext: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  await writeAtomically(path.join(UPLOAD_DIR, filename), data);
  return filename;
}

export function isVariantWidth(value: number): value is VariantWidth {
  return (VARIANT_WIDTHS as readonly number[]).includes(value);
}

// The resized copy of an upload, made on first request and kept on disk
// afterwards. Null when the file isn't a still image (GIFs and videos are
// always served as they are).
export async function getVariant(filename: string, width: VariantWidth): Promise<Buffer | null> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (!RESIZABLE.has(ext)) return null;
  const variantPath = path.join(VARIANT_DIR, `${width}-${filename}.webp`);
  try {
    return await readFile(variantPath);
  } catch {
    // Not made yet.
  }
  const original = await readFile(path.join(UPLOAD_DIR, filename));
  const data = await sharp(original)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 76 })
    .toBuffer();
  await mkdir(VARIANT_DIR, { recursive: true });
  await writeAtomically(variantPath, data);
  return data;
}

const STRIPPED_MARKER = path.join(UPLOAD_DIR, ".metadata-stripped-v1");

// Photos uploaded before uploads were re-encoded still carry their EXIF
// (GPS included). This rewrites each of those once, in place and in the same
// format — same filename, so every link to it keeps working — and leaves a
// marker so later restarts skip the scan. Runs in the background at server
// start (see src/instrumentation.ts); a file it can't read is left alone.
export async function stripMetadataFromExistingUploads(): Promise<void> {
  try {
    await stat(STRIPPED_MARKER);
    return;
  } catch {
    // Not done yet.
  }
  let names: string[];
  try {
    names = await readdir(UPLOAD_DIR);
  } catch {
    return; // No uploads yet.
  }
  let rewritten = 0;
  for (const name of names) {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (!RESIZABLE.has(ext) || name.startsWith(".")) continue;
    const filePath = path.join(UPLOAD_DIR, name);
    try {
      const input = await readFile(filePath);
      const meta = await sharp(input).metadata();
      if (!meta.exif && !meta.xmp && !meta.iptc) continue;
      const image = sharp(input).rotate();
      const output =
        ext === "png"
          ? await image.png().toBuffer()
          : ext === "webp"
            ? await image.webp({ quality: 85 }).toBuffer()
            : await image.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
      await writeAtomically(filePath, output);
      // A resized copy made from the old file is still fine (sharp never
      // copied metadata into those), so the cache doesn't need clearing.
      rewritten++;
    } catch (err) {
      console.error(`[images] could not strip metadata from ${name}:`, err);
    }
  }
  await writeFile(STRIPPED_MARKER, new Date().toISOString());
  console.log(`[images] stripped metadata from ${rewritten} existing upload(s)`);
}
