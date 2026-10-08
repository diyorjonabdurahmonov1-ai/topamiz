import { NextResponse } from "next/server";
import { displayIdentity, getCurrentUser } from "@/lib/auth";
import { cities } from "@/lib/data";
import { getFollowerIds } from "@/lib/friends";
import {
  createListing,
  MAX_LISTING_DESCRIPTION_LENGTH,
  MAX_LISTING_PHOTOS,
  MAX_LISTING_TITLE_LENGTH,
} from "@/lib/listings";
import { containsProhibitedContent, recordModerationViolation } from "@/lib/moderation";
import { sendPushToUser } from "@/lib/push";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { countryForIp } from "@/lib/geo";
import { R2_PUBLIC_URL } from "@/lib/r2";
import { getUploadSession } from "@/lib/video-uploads";

// Uploaded photos only ever come back from POST /api/upload as this prefix —
// anything else is a client claiming an arbitrary external URL is one of ours.
const OWN_UPLOAD_PREFIX = "/api/uploads/";
const MIN_MINUTES_AHEAD = 5;
const MAX_DAYS_AHEAD = 30;

// A public, non-admin creation path for "Sirli quti" — unlike an ordinary
// listing, anyone can post one here (no phone/contact fields collected),
// but it always carries an expiry and never a real phone number.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const ip = getClientIp(request);
  const limit = rateLimit(`mystery-box-create:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, MAX_LISTING_TITLE_LENGTH) : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const extraInfo = typeof body?.extraInfo === "string" ? body.extraInfo.trim() : "";
  const fullDescription = (extraInfo ? `${description}\n\n${extraInfo}` : description).slice(
    0,
    MAX_LISTING_DESCRIPTION_LENGTH
  );
  const city = typeof body?.city === "string" && cities.includes(body.city) ? body.city : null;
  const photoUrls = Array.isArray(body?.photoUrls)
    ? body.photoUrls
        .filter((u: unknown): u is string => typeof u === "string" && u.startsWith(OWN_UPLOAD_PREFIX))
        .slice(0, MAX_LISTING_PHOTOS)
    : [];
  const videoUrl =
    typeof body?.videoUrl === "string" && R2_PUBLIC_URL && body.videoUrl.startsWith(R2_PUBLIC_URL)
      ? body.videoUrl
      : null;
  const videoThumbnailUrl =
    typeof body?.videoThumbnailUrl === "string" &&
    R2_PUBLIC_URL &&
    body.videoThumbnailUrl.startsWith(R2_PUBLIC_URL)
      ? body.videoThumbnailUrl
      : null;
  // A video still uploading in the background counts toward "a photo or a
  // video" — it's attached to the listing as soon as it's ready.
  const pendingVideo =
    typeof body?.videoUploadId === "string" ? getUploadSession(body.videoUploadId, user.id) : null;
  const hasPendingVideo = !!pendingVideo && pendingVideo.status !== "error";
  const latRaw = body?.lat;
  const lngRaw = body?.lng;
  const lat =
    typeof latRaw === "number" && Number.isFinite(latRaw) && latRaw >= -90 && latRaw <= 90
      ? latRaw
      : null;
  const lng =
    typeof lngRaw === "number" && Number.isFinite(lngRaw) && lngRaw >= -180 && lngRaw <= 180
      ? lngRaw
      : null;

  if (
    !title ||
    !description ||
    !city ||
    lat === null ||
    lng === null ||
    (photoUrls.length === 0 && !videoUrl && !hasPendingVideo)
  ) {
    return NextResponse.json(
      { error: "Iltimos, * bilan belgilangan barcha maydonlarni to'ldiring." },
      { status: 400 }
    );
  }

  const expiresAtRaw = typeof body?.expiresAt === "string" ? new Date(body.expiresAt) : null;
  if (!expiresAtRaw || Number.isNaN(expiresAtRaw.getTime())) {
    return NextResponse.json({ error: "Amal qilish muddatini tanlang." }, { status: 400 });
  }
  const minAllowed = Date.now() + MIN_MINUTES_AHEAD * 60 * 1000;
  const maxAllowed = Date.now() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000;
  if (expiresAtRaw.getTime() < minAllowed) {
    return NextResponse.json(
      { error: `Amal qilish muddati hozirdan kamida ${MIN_MINUTES_AHEAD} daqiqa keyin bo'lishi kerak.` },
      { status: 400 }
    );
  }
  if (expiresAtRaw.getTime() > maxAllowed) {
    return NextResponse.json(
      { error: `Amal qilish muddati ${MAX_DAYS_AHEAD} kundan ortiq bo'lishi mumkin emas.` },
      { status: 400 }
    );
  }
  const expiresAt = expiresAtRaw.toISOString().slice(0, 19).replace("T", " ");

  // The video's reveal time — optional, and only meaningful when earlier
  // than the listing's own expiry (a box that's already closed can't still
  // have its video "about to open").
  let startsAt: string | null = null;
  if (typeof body?.startsAt === "string") {
    const startsAtRaw = new Date(body.startsAt);
    if (Number.isNaN(startsAtRaw.getTime())) {
      return NextResponse.json({ error: "Boshlanish vaqti noto'g'ri." }, { status: 400 });
    }
    if (startsAtRaw.getTime() < minAllowed) {
      return NextResponse.json(
        { error: `Boshlanish vaqti hozirdan kamida ${MIN_MINUTES_AHEAD} daqiqa keyin bo'lishi kerak.` },
        { status: 400 }
      );
    }
    if (startsAtRaw.getTime() >= expiresAtRaw.getTime()) {
      return NextResponse.json(
        { error: "Boshlanish vaqti amal qilish muddatidan oldin bo'lishi kerak." },
        { status: 400 }
      );
    }
    startsAt = startsAtRaw.toISOString().slice(0, 19).replace("T", " ");
  }

  if (containsProhibitedContent(`${title} ${fullDescription}`)) {
    const { blocked } = recordModerationViolation(user.id);
    return NextResponse.json(
      {
        error: blocked
          ? "Bu e'lon mumkin bo'lmagan kontent sababli rad etildi. Qoidabuzarlik takrorlanganligi uchun hisobingiz bloklandi."
          : "Bu e'lon mumkin bo'lmagan kontent (so'kinish, zo'ravonlik yoki jinsiy mazmun) sababli rad etildi. Keyingi safar shunday urinish qilsangiz, hisobingiz bloklanadi.",
        blocked,
      },
      { status: 400 }
    );
  }

  const posterIdentity = displayIdentity(user);
  const listing = createListing({
    ownerId: user.id,
    kind: "found",
    title,
    description: fullDescription,
    category: "boshqa",
    city,
    reward: null,
    contactName: posterIdentity.name,
    contactPhone: "",
    photoUrls,
    videoUrl,
    videoThumbnailUrl,
    country: countryForIp(ip),
    lat,
    lng,
    isMysteryBox: true,
    expiresAt,
    startsAt,
  });

  for (const friendId of getFollowerIds(user.id)) {
    void sendPushToUser(friendId, {
      title: posterIdentity.name,
      body: `Yangi Sirli quti joyladi: ${listing.title}`,
      url: `/elonlar/${listing.id}`,
    });
  }

  return NextResponse.json({ listing });
}
