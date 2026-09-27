"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";

const ListingsMap = dynamic(() => import("./ListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-border bg-surface">
      <Loader2 className="h-5 w-5 animate-spin text-muted" />
    </div>
  ),
});

// A purely decorative teaser — non-interactive (see ListingsMap's
// `interactive` prop) and wrapped in one big link, so on mobile it never
// captures a scroll gesture the way a real draggable map would.
export default function HomeMapPreview({ listings, dict }: { listings: Listing[]; dict: Dictionary }) {
  if (listings.length === 0) return null;

  return (
    <Link
      href="/elonlar"
      className="card-hover relative mt-8 block h-56 overflow-hidden rounded-2xl border border-border"
    >
      <div className="pointer-events-none absolute inset-0">
        <ListingsMap listings={listings} dict={dict} interactive={false} heightClassName="h-56" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/80 to-transparent p-4">
        <p className="text-sm font-bold text-foreground">{dict.map.nearbyHeading}</p>
        <p className="text-xs text-muted">{dict.map.nearbyHint}</p>
      </div>
    </Link>
  );
}
