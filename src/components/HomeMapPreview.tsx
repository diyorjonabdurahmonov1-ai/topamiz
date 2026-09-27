"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowUpRight, Loader2, MapPin } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatItemsCount } from "@/lib/i18n/format";

const ListingsMap = dynamic(() => import("./ListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface">
      <Loader2 className="h-5 w-5 animate-spin text-muted" />
    </div>
  ),
});

// A purely decorative teaser — non-interactive (see ListingsMap's
// `interactive` prop) and wrapped in one big link, so on mobile it never
// captures a scroll gesture the way a real draggable map would. Height is
// viewport-relative (dvh, not vh) and clamped so it fills whatever's left
// under the fold on a phone without ever landing half on/half off screen,
// and falls back to a fixed height once there's room to spare (sm+).
export default function HomeMapPreview({
  listings,
  dict,
  locale,
}: {
  listings: Listing[];
  dict: Dictionary;
  locale: Locale;
}) {
  if (listings.length === 0) return null;

  return (
    <Link
      href="/elonlar"
      className="card-hover group relative mt-6 block h-[38dvh] max-h-80 min-h-[220px] overflow-hidden rounded-2xl border border-border sm:h-64 sm:max-h-none"
    >
      <div className="pointer-events-none absolute inset-0">
        <ListingsMap listings={listings} dict={dict} interactive={false} bare />
      </div>

      {/* subtle color wash so the map reads as part of the app, not a raw embed */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-via/10 via-transparent to-bg/90" />

      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-bg/80 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-lg backdrop-blur">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        </span>
        {formatItemsCount(locale, listings.length)}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <MapPin className="h-4 w-4 text-brand-via" />
            {dict.map.nearbyHeading}
          </p>
          <p className="mt-0.5 text-xs text-muted">{dict.map.nearbyHint}</p>
        </div>
        <span className="btn-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-transform group-hover:scale-110">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
