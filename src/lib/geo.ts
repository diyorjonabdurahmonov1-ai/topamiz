import { headers } from "next/headers";
import geoip from "geoip-lite";

// This app started out serving only Uzbekistan, so an IP we can't place
// (localhost, a private network, a lookup miss) falls back here rather than
// showing an empty listings page.
export const DEFAULT_COUNTRY = "UZ";

export function countryForIp(ip: string | null): string {
  if (!ip) return DEFAULT_COUNTRY;
  const geo = geoip.lookup(ip);
  return geo?.country ?? DEFAULT_COUNTRY;
}

// For Server Components/pages, which only have access to the incoming
// headers, not the raw request/socket.
export async function getVisitorCountry(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip");
  return countryForIp(ip);
}
