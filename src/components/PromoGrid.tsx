"use client";

import { useMemo, useState } from "react";
import type { Listing, PromoCategoryId } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { promoCategories } from "@/lib/data";
import { promoCategoryIcons } from "@/lib/icons";
import ListingsGrid from "./ListingsGrid";

type FilterValue = "all" | PromoCategoryId;

export default function PromoGrid({ listings, dict }: { listings: Listing[]; dict: Dictionary }) {
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = useMemo(
    () => (filter === "all" ? listings : listings.filter((l) => l.promoCategory === filter)),
    [listings, filter]
  );

  return (
    <div>
      <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
            filter === "all"
              ? "border-sky-500/50 bg-sky-500/10 text-sky-500"
              : "border-border text-muted hover:text-foreground"
          }`}
        >
          {dict.promo.allCategories}
        </button>
        {promoCategories.map((c) => {
          const Icon = promoCategoryIcons[c.id];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                filter === c.id
                  ? "border-sky-500/50 bg-sky-500/10 text-sky-500"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {dict.promoCategories[c.id]}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-semibold">{dict.promo.emptyTitle}</p>
          <p className="mt-1 max-w-sm text-sm text-muted">{dict.promo.emptyBody}</p>
        </div>
      ) : (
        <div className="mt-6">
          <ListingsGrid listings={filtered} dict={dict} />
        </div>
      )}
    </div>
  );
}
