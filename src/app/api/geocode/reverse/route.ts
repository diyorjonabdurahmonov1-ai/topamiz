import { NextResponse } from "next/server";
import { cities } from "@/lib/data";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Nominatim (OpenStreetMap's free reverse-geocoding service) requires a
// real identifying User-Agent and asks that callers stay under ~1 request/sec
// — fine here since this only fires on an explicit user action (picking a
// point), never on a timer or in bulk.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  county?: string;
  suburb?: string;
  city_district?: string;
  district?: string;
}

function matchKnownCity(candidates: (string | undefined)[]): string | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const lower = candidate.toLowerCase();
    const match = cities.find((c) => lower.includes(c.toLowerCase()));
    if (match) return match;
  }
  return null;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`geocode-reverse:${ip}`, 20, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Noto'g'ri koordinata" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=uz,ru`,
      { headers: { "User-Agent": "Findo/1.0 (https://findo.net.uz)" } }
    );
    if (!res.ok) return NextResponse.json({ city: null, district: null });

    const data = (await res.json()) as { address?: NominatimAddress };
    const address = data.address ?? {};
    const city = matchKnownCity([address.city, address.town, address.state, address.county, address.village]);
    const district = address.suburb || address.city_district || address.district || address.county || null;

    return NextResponse.json({ city, district });
  } catch {
    return NextResponse.json({ city: null, district: null });
  }
}
