"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, Loader2, MapPin, Navigation } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

const LeafletPinMap = dynamic(() => import("./LeafletPinMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 w-full items-center justify-center rounded-xl border border-border bg-bg-elevated">
      <Loader2 className="h-5 w-5 animate-spin text-muted" />
    </div>
  ),
});

export default function ListingLocationMap({
  lat,
  lng,
  city,
  district,
  dict,
}: {
  lat: number;
  lng: number;
  city: string;
  district?: string;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? dict.listingDetail.hideMap : dict.listingDetail.showOnMap}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <MapPin className="h-4 w-4" />
        {city}
        {district ? `, ${district}` : ""}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="animate-fade-up mt-3">
          <LeafletPinMap lat={lat} lng={lng} dict={dict} />
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brand mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
          >
            <Navigation className="h-3.5 w-3.5" />
            {dict.listingDetail.getDirections}
          </a>
        </div>
      )}
    </div>
  );
}
