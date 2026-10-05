"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
import { formatSom } from "@/lib/data";
import type { Dictionary } from "@/lib/i18n";

interface PreviewListing {
  id: string;
  title: string;
  city: string;
  reward: number | null;
  status: string;
  thumbnailUrl: string | null;
}

export default function SharedListingCard({
  listingId,
  fallbackTitle,
  dict,
}: {
  listingId: string;
  fallbackTitle: string;
  dict: Dictionary;
}) {
  const [listing, setListing] = useState<PreviewListing | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/listings/${listingId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.listing) setListing(data.listing);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  return (
    <Link
      href={`/elonlar/${listingId}`}
      className="flex items-center gap-2.5 overflow-hidden rounded-xl border border-white/15 bg-black/10 p-2"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
        {listing?.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded content served from /api/uploads or Cloudflare R2, not a build-time asset
          <img src={listing.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold">{listing?.title ?? fallbackTitle}</p>
        {listing && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] opacity-80">
            {listing.reward ? (
              <>
                <Gift className="h-3 w-3" />
                {formatSom(listing.reward)}
              </>
            ) : (
              listing.city
            )}
          </p>
        )}
        <p className="mt-0.5 text-[11px] font-semibold opacity-80">{dict.social.reelsViewListing}</p>
      </div>
    </Link>
  );
}
