// A smaller copy of an uploaded photo (see /api/uploads/[filename] and
// lib/images.ts): cards, avatars and thumbnails ask for one instead of the
// full-size photo. Anything that isn't one of our own still-image uploads
// (Google avatars, R2 video posters, GIFs) comes back unchanged.
export type ImageWidth = 240 | 480 | 960;

export function sizedImage(url: string, width: ImageWidth): string;
export function sizedImage(url: string | null | undefined, width: ImageWidth): string | null;
export function sizedImage(url: string | null | undefined, width: ImageWidth): string | null {
  if (!url) return null;
  if (!url.startsWith("/api/uploads/") || url.includes("?")) return url;
  return /\.(jpe?g|png|webp)$/i.test(url) ? `${url}?w=${width}` : url;
}
