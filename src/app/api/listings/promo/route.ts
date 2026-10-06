import { NextResponse } from "next/server";
import { displayIdentity, getCurrentUser } from "@/lib/auth";
import { cities, promoCategories } from "@/lib/data";
import { getFollowerIds } from "@/lib/friends";
import {
  createListing,
  MAX_CONTACT_PHONE_LENGTH,
  MAX_LISTING_DESCRIPTION_LENGTH,
  MAX_LISTING_PHOTOS,
  MAX_LISTING_TITLE_LENGTH,
} from "@/lib/listings";
import { containsProhibitedContent, recordModerationViolation } from "@/lib/moderation";
import { sendPushToUser } from "@/lib/push";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { countryForIp } from "@/lib/geo";
import { R2_PUBLIC_URL } from "@/lib/r2";
import type { PromoCategoryId } from "@/lib/types";

// Uploaded photos only ever come back from POST /api/upload as this prefix —
// anything else is a client claiming an arbitrary external URL is one of ours.
const OWN_UPLOAD_PREFIX = "/api/uploads/";
const PROMO_CATEGORY_IDS = new Set(promoCategories.map((c) => c.id));
const MAX_TARIFFS_LENGTH = 500;

// A public, non-admin creation path for "Aksiyalar" — any logged-in user can
// post a business promo/deal, same openness as Sirli quti. Unlike an
// ordinary lost/found listing it never carries a reward and never resolves,
// but it does keep a real contact phone (so customers can actually reach
// the business) and its own category taxonomy.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const ip = getClientIp(request);
  const limit = rateLimit(`promo-create:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, MAX_LISTING_TITLE_LENGTH) : "";
  const description =
    typeof body?.description === "string"
      ? body.description.trim().slice(0, MAX_LISTING_DESCRIPTION_LENGTH)
      : "";
  const tariffs =
    typeof body?.tariffs === "string" ? body.tariffs.trim().slice(0, MAX_TARIFFS_LENGTH) : "";
  const fullDescription = (tariffs ? `${description}\n\nNarxlar/tariflar: ${tariffs}` : description).slice(
    0,
    MAX_LISTING_DESCRIPTION_LENGTH
  );
  const promoCategory =
    typeof body?.promoCategory === "string" && PROMO_CATEGORY_IDS.has(body.promoCategory as PromoCategoryId)
      ? (body.promoCategory as PromoCategoryId)
      : null;
  const city = typeof body?.city === "string" && cities.includes(body.city) ? body.city : null;
  const contactPhone =
    typeof body?.contactPhone === "string"
      ? body.contactPhone.trim().slice(0, MAX_CONTACT_PHONE_LENGTH)
      : "";
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

  if (!title || !promoCategory || !city || !contactPhone) {
    return NextResponse.json(
      { error: "Iltimos, * bilan belgilangan barcha maydonlarni to'ldiring." },
      { status: 400 }
    );
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
    contactName: user.name.trim().slice(0, 80),
    contactPhone,
    photoUrls,
    videoUrl,
    videoThumbnailUrl,
    country: countryForIp(ip),
    lat,
    lng,
    isPromo: true,
    promoCategory,
  });

  for (const friendId of getFollowerIds(user.id)) {
    void sendPushToUser(friendId, {
      title: posterIdentity.name,
      body: `Yangi aksiya joyladi: ${listing.title}`,
      url: `/elonlar/${listing.id}`,
    });
  }

  return NextResponse.json({ listing });
}
