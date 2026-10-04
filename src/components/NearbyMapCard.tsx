"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Loader2, Navigation } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";

const ListingsMap = dynamic(() => import("./ListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface-2">
      <Loader2 className="h-5 w-5 animate-spin text-muted" />
    </div>
  ),
});

// A compact, non-interactive teaser for the home page's quick-access grid —
// same real tiles/pins as /elonlar's map view, just wrapped in one link so a
// finger dragging it scrolls the page instead of panning the map.
export default function NearbyMapCard({ listings, dict }: { listings: Listing[]; dict: Dictionary }) {
  const [me, setMe] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setMe([position.coords.latitude, position.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  const href = me ? `/elonlar?view=map&lat=${me[0]}&lng=${me[1]}` : "/elonlar?view=map";

  return (
    <Link
      href={href}
      className="card-hover group relative block min-h-[120px] overflow-hidden rounded-2xl border border-border"
    >
      <div className="pointer-events-none absolute inset-0">
        <ListingsMap listings={listings} dict={dict} interactive={false} bare initialMe={me} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg/90" />
      <Navigation className="pointer-events-none absolute right-4 top-4 h-5 w-5 text-brand-via" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
        <p className="text-sm font-bold">{dict.homeQuickAccess.nearbyTitle}</p>
        <p className="text-xs text-muted">{dict.listingDetail.showOnMap}</p>
      </div>
    </Link>
  );
}
