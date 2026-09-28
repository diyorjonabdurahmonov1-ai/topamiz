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

  if (!title || !description || !city || lat === null || lng === null || photoUrls.length === 0) {
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
    country: countryForIp(ip),
    lat,
    lng,
    isMysteryBox: true,
    expiresAt,
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
