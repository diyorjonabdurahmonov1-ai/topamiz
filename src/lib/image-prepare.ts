// Shrinks a photo on the phone before it's uploaded: today's cameras take
// 12–200MP pictures (often 5–20MB), which are slow to send over mobile data
// and far bigger than any screen shows. Redrawing it on a canvas also drops
// the EXIF block — including the GPS position the camera wrote into it,
// which would otherwise tell anyone who downloads the photo where it was
// taken. The server strips metadata again regardless (see lib/images.ts);
// this is about speed and about the data never leaving the phone.
//
// HEIC (iPhones, and Samsung's "high efficiency" setting) is decoded natively
// where the browser can (Safari); elsewhere a WebAssembly decoder is loaded
// on demand, only when such a file is actually picked.
//
// Anything that can't be decoded here is uploaded as is, and the server
// either handles it or explains what's wrong.

const MAX_SIDE = 2048;
const JPEG_QUALITY = 0.85;

function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // Older Safari rejects the options bag, some formats only decode via
      // <img> — fall through.
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function decodeHeic(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await decode(file);
  } catch {
    const { heicTo } = await import("heic-to/next");
    return heicTo({ blob: file, type: "bitmap" });
  }
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
}

export async function prepareImageForUpload(file: File): Promise<File> {
  // An animated GIF would lose its animation on a canvas; the server keeps
  // it animated and strips its metadata itself.
  if (file.type === "image/gif") return file;
  try {
    const source = isHeic(file) ? await decodeHeic(file) : await decode(file);
    const width = "naturalWidth" in source ? source.naturalWidth : source.width;
    const height = "naturalHeight" in source ? source.naturalHeight : source.height;
    if (!width || !height) return file;

    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // JPEG has no transparency — a transparent PNG would otherwise turn black.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    if ("close" in source) source.close();

    const blob = await toJpeg(canvas);
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]*$/, "") || "photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
