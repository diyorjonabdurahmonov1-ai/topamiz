import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { categories, cities } from "@/lib/data";
import { getFollowerIds } from "@/lib/friends";
import { notify } from "@/lib/notifications";
import {
  createListing,
  MAX_CONTACT_NAME_LENGTH,
  MAX_CONTACT_PHONE_LENGTH,
  MAX_DISTRICT_LENGTH,
  MAX_LISTING_DESCRIPTION_LENGTH,
  MAX_LISTING_PHOTOS,
  MAX_LISTING_TITLE_LENGTH,
} from "@/lib/listings";
import { containsProhibitedContent, recordModerationViolation } from "@/lib/moderation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { countryForIp } from "@/lib/geo";
import { nearestCityForCoordinates } from "@/lib/city-coordinates";
import { R2_PUBLIC_URL } from "@/lib/r2";
import type { CategoryId, ListingKind } from "@/lib/types";

// Uploaded photos only ever come back from POST /api/upload as this prefix —
// anything else is a client claiming an arbitrary external URL is one of ours.
const OWN_UPLOAD_PREFIX = "/api/uploads/";
const CATEGORY_IDS = new Set(categories.map((c) => c.id));

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const ip = getClientIp(request);
  const limit = rateLimit(`listing-create:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const kind = body?.kind === "lost" || body?.kind === "found" ? (body.kind as ListingKind) : null;
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, MAX_LISTING_TITLE_LENGTH) : "";
  const description =
    typeof body?.description === "string"
      ? body.description.trim().slice(0, MAX_LISTING_DESCRIPTION_LENGTH)
      : "";
  const category =
    typeof body?.category === "string" && CATEGORY_IDS.has(body.category as CategoryId)
      ? (body.category as CategoryId)
      : null;
  const district =
    typeof body?.district === "string" && body.district.trim()
      ? body.district.trim().slice(0, MAX_DISTRICT_LENGTH)
      : null;
  const rewardRaw = body?.reward;
  const reward =
    typeof rewardRaw === "number" && Number.isFinite(rewardRaw) && rewardRaw > 0
      ? Math.round(rewardRaw)
      : null;
  // The poster's contact name is always their own account name — not a
  // separate form field — so there's nothing here for a client to spoof.
  const contactName = user.name.trim().slice(0, MAX_CONTACT_NAME_LENGTH);
  const contactPhone =
    typeof body?.contactPhone === "string"
      ? body.contactPhone.trim().slice(0, MAX_CONTACT_PHONE_LENGTH)
      : "";
  const photoUrls = Array.isArray(body?.photoUrls)
    ? body.photoUrls
        .filter((u: unknown): u is string => typeof u === "string" && u.startsWith(OWN_UPLOAD_PREFIX))
        .slice(0, MAX_LISTING_PHOTOS)
    : [];
  // Uploaded videos/thumbnails only ever come back from POST /api/upload-video
  // pointed at our own R2 bucket — anything else is a client claiming an
  // arbitrary external URL is one of ours.
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
  const latRaw = body?.lat;
  const lngRaw = body?.lng;
  const lat =
    typeof latRaw === "number" && Number.isFinite(latRaw) && latRaw >= -90 && latRaw <= 90
      ? latRaw
      : undefined;
  const lng =
    typeof lngRaw === "number" && Number.isFinite(lngRaw) && lngRaw >= -180 && lngRaw <= 180
      ? lngRaw
      : undefined;

  // Only what and where are required. "Where" is either one of our cities
  // or a point on the map — a point posted while the form was still
  // reverse-geocoding it falls back to the nearest city. The phone number
  // is optional: anyone can reach the poster through the site's chat.
  const city =
    typeof body?.city === "string" && cities.includes(body.city)
      ? body.city
      : lat !== undefined && lng !== undefined
        ? nearestCityForCoordinates(lat, lng)
        : null;

  if (!kind || !title || !category) {
    return NextResponse.json({ error: "Nima yo'qolgani yoki topilganini yozing." }, { status: 400 });
  }
  if (!city) {
    return NextResponse.json(
      { error: "Taxminiy joyni belgilang — shahar yoki xaritadagi nuqta." },
      { status: 400 }
    );
  }

  if (containsProhibitedContent(`${title} ${description}`)) {
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

  const listing = createListing({
    ownerId: user.id,
    kind,
    title,
    description,
    category,
    city,
    district,
    reward,
    contactName,
    contactPhone,
    photoUrls,
    videoUrl,
    videoThumbnailUrl,
    country: countryForIp(ip),
    lat,
    lng,
  });

  for (const friendId of getFollowerIds(user.id)) {
    notify({ userId: friendId, type: "friend_listing", actorId: user.id, listingId: Number(listing.id) });
  }

  return NextResponse.json({ listing });
}
