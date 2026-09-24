"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Listing } from "@/lib/types";
import ListingCard from "@/components/ListingCard";

export default function ListingRow({ listings }: { listings: Listing[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByAmount(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="group/row relative">
      <div
        ref={scrollerRef}
        className="scrollbar-thin -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      >
        {listings.map((listing) => (
          <div key={listing.id} className="w-[78%] shrink-0 snap-start sm:w-72 lg:w-80">
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollByAmount(-1)}
        aria-label="Oldingilar"
        className="absolute left-1 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 p-2 text-foreground opacity-0 shadow-lg backdrop-blur transition-opacity hover:bg-surface-2 group-hover/row:opacity-100 lg:flex"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollByAmount(1)}
        aria-label="Keyingilar"
        className="absolute right-1 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 p-2 text-foreground opacity-0 shadow-lg backdrop-blur transition-opacity hover:bg-surface-2 group-hover/row:opacity-100 lg:flex"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
