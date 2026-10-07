"use client";

import { useStartsAtLock } from "@/lib/useStartsAtLock";
import type { Dictionary } from "@/lib/i18n";
import ListingLocationMap from "./ListingLocationMap";

// The location is part of the mystery too — a Sirli quti with a reveal
// time doesn't show where it is at all until that time passes, not even
// a blurred hint.
export default function MysteryBoxLocationGate({
  startsAt,
  lat,
  lng,
  city,
  district,
  dict,
}: {
  startsAt: string;
  lat: number;
  lng: number;
  city: string;
  district?: string;
  dict: Dictionary;
}) {
  const locked = useStartsAtLock(startsAt);
  if (locked) return null;
  return <ListingLocationMap lat={lat} lng={lng} city={city} district={district} dict={dict} />;
}
