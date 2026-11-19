import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isR2Configured } from "@/lib/r2";
import { getListingOwnerId } from "@/lib/listings";
import {
  CHUNK_SIZE,
  MAX_RAW_SIZE,
  attachToListing,
  createUploadSession,
  isAcceptableVideoType,
} from "@/lib/video-uploads";

// Starts a chunked upload. The file itself then arrives in CHUNK_SIZE pieces
// via PUT /api/upload-video/[id], so no single request has to carry a whole
// phone video past the reverse proxy's body-size limit.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return await apiError("signInRequired", 401);

  if (!isR2Configured()) {
    return await apiError("videoUnavailable", 503);
  }

  const body = await request.json().catch(() => null);
  const type = typeof body?.type === "string" ? body.type : "";
  const size = typeof body?.size === "number" ? body.size : 0;
  if (!isAcceptableVideoType(type)) {
    return await apiError("videoOnly", 400);
  }
  if (!Number.isInteger(size) || size <= 0) {
    return await apiError("fileNotFound", 400);
  }
  if (size > MAX_RAW_SIZE) {
    return await apiError("videoTooLarge", 400);
  }

  const ip = getClientIp(request);
  const limit = rateLimit(`upload-video:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p video yuklandi. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  // A retry for a listing that's already published passes its id, so the
  // video still lands on that listing once this new upload finishes.
  const listingId = typeof body?.listingId === "string" ? body.listingId : null;
  if (listingId && getListingOwnerId(listingId) !== user.id) {
    return await apiError("forbidden", 403);
  }

  const session = await createUploadSession(user.id, size);
  if (listingId) attachToListing(session, listingId);
  return NextResponse.json({ uploadId: session.id, chunkSize: CHUNK_SIZE });
}
