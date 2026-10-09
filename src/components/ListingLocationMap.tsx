"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, Loader2, Navigation } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { CategoryId } from "@/lib/types";

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
  category,
  colorFrom,
  colorTo,
  dict,
}: {
  lat: number;
  lng: number;
  city: string;
  district?: string;
  category: CategoryId;
  colorFrom: string;
  colorTo: string;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div>
      {/* Uses the same "Navigation" icon and accent color as the Get
          Directions button below it, so it visually reads as the start of
          that same action rather than a plain, easy-to-miss location label —
          people were not realizing this was clickable at all. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-brand-via/30 bg-brand-via/5 px-4 py-2.5 text-sm font-semibold text-brand-via transition-colors hover:bg-brand-via/10"
      >
        <Navigation className="h-4 w-4 shrink-0" />
        <span>
          {city}
          {district ? `, ${district}` : ""}
        </span>
        <span className="text-xs font-medium text-muted">
          · {open ? dict.listingDetail.hideMap : dict.listingDetail.showOnMap}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="animate-fade-up mt-3">
          <LeafletPinMap lat={lat} lng={lng} category={category} colorFrom={colorFrom} colorTo={colorTo} />
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
