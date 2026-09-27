import { cookies } from "next/headers";
import { getVisitorCountry } from "../geo";
import { LOCALE_COOKIE, isLocale, localeForCountry, type Locale } from "./locales";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(value)) return value;

  // First-time visitor with no language cookie yet (proxy.ts normally sets
  // one before this runs) — guess from their IP so the very first page they
  // see is already in the right language instead of lagging a request behind.
  const country = await getVisitorCountry();
  return localeForCountry(country);
}
