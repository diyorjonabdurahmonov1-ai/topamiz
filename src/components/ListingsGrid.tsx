"use client";

import { useState } from "react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import ListingCard from "./ListingCard";

const PAGE_SIZE = 12;

export default function ListingsGrid({ listings, dict }: { listings: Listing[]; dict: Dictionary }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = listings.slice(0, visibleCount);
  const hasMore = visibleCount < listings.length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((listing) => (
          <ListingCard key={listing.id} listing={listing} dict={dict} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="rounded-xl border border-border bg-surface px-6 py-2.5 text-sm font-semibold hover:bg-surface-2"
          >
            {dict.listingsPage.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
