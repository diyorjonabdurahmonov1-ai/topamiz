import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { categories, cities } from "@/lib/data";
import {
  createListing,
  MAX_CONTACT_NAME_LENGTH,
  MAX_CONTACT_PHONE_LENGTH,
  MAX_LISTING_DESCRIPTION_LENGTH,
  MAX_LISTING_PHOTOS,
  MAX_LISTING_TITLE_LENGTH,
} from "@/lib/listings";
import { containsProhibitedContent, recordModerationViolation } from "@/lib/moderation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { countryForIp } from "@/lib/geo";
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
  const city = typeof body?.city === "string" && cities.includes(body.city) ? body.city : null;
  const rewardRaw = body?.reward;
  const reward =
    typeof rewardRaw === "number" && Number.isFinite(rewardRaw) && rewardRaw > 0
      ? Math.round(rewardRaw)
      : null;
  const contactName =
    typeof body?.contactName === "string" ? body.contactName.trim().slice(0, MAX_CONTACT_NAME_LENGTH) : "";
  const contactPhone =
    typeof body?.contactPhone === "string"
      ? body.contactPhone.trim().slice(0, MAX_CONTACT_PHONE_LENGTH)
      : "";
  const photoUrls = Array.isArray(body?.photoUrls)
    ? body.photoUrls
        .filter((u: unknown): u is string => typeof u === "string" && u.startsWith(OWN_UPLOAD_PREFIX))
        .slice(0, MAX_LISTING_PHOTOS)
    : [];

  if (!kind || !title || !description || !category || !city || !contactName || !contactPhone) {
    return NextResponse.json(
      { error: "Iltimos, * bilan belgilangan barcha maydonlarni to'ldiring." },
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
    reward,
    contactName,
    contactPhone,
    photoUrls,
    country: countryForIp(ip),
  });

  return NextResponse.json({ listing });
}
