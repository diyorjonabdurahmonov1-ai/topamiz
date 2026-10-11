"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { List, Loader2, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import type { CategoryId, Listing, ListingKind } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatResultsCount } from "@/lib/i18n/format";
import { cities } from "@/lib/data";
import { ALL_CATEGORIES, categoriesFor, LISTING_KINDS } from "@/lib/sections";
import { kindLabel } from "@/lib/listing-labels";
import { smartSearch } from "@/lib/ai";
import ListingsGrid from "./ListingsGrid";

const ListingsMap = dynamic(() => import("./ListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center rounded-2xl border border-border bg-surface">
      <Loader2 className="h-6 w-6 animate-spin text-muted" />
    </div>
  ),
});

type KindFilter = "all" | ListingKind;
type ViewMode = "list" | "map";
type SortMode = "new" | "cheap" | "expensive";

// Only for ordering by price across currencies — cars and flats are priced
// in dollars, most things in so'm. A rough rate is enough to sort by.
const USD_TO_UZS = 12_800;

function priceInUzs(l: Listing): number | null {
  if (!l.price) return null;
  return l.currency === "USD" ? l.price * USD_TO_UZS : l.price;
}

export default function ListingsExplorer({
  initialQuery = "",
  initialKind = "all",
  initialCategory = "all",
  initialCity = "all",
  initialView = "list",
  initialFocus = null,
  listings,
  dict,
  locale,
}: {
  initialQuery?: string;
  initialKind?: KindFilter;
  initialCategory?: CategoryId | "all";
  initialCity?: string;
  initialView?: ViewMode;
  initialFocus?: [number, number] | null;
  listings: Listing[];
  dict: Dictionary;
  locale: Locale;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<KindFilter>(initialKind);
  const [category, setCategory] = useState<CategoryId | "all">(initialCategory);
  const [city, setCity] = useState<string>(initialCity);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<ViewMode>(initialView);
  const [sort, setSort] = useState<SortMode>("new");
  const categoryOptions = kind === "all" ? ALL_CATEGORIES : categoriesFor(kind);

  const results = useMemo(() => {
    let pool: Listing[] = listings;
    if (kind !== "all") pool = pool.filter((l) => l.kind === kind);
    if (category !== "all") pool = pool.filter((l) => l.category === category);
    if (city !== "all") pool = pool.filter((l) => l.city === city);
    if (query.trim()) pool = smartSearch(query, pool);
    if (sort !== "new") {
      // Listings without a price go last either way.
      const dir = sort === "cheap" ? 1 : -1;
      pool = [...pool].sort((a, b) => {
        const pa = priceInUzs(a);
        const pb = priceInUzs(b);
        if (pa === null) return pb === null ? 0 : 1;
        if (pb === null) return -1;
        return (pa - pb) * dir;
      });
    }
    return pool;
  }, [listings, query, kind, category, city, sort]);

  function resetFilters() {
    setQuery("");
    setKind("all");
    setCategory("all");
    setCity("all");
    setSort("new");
  }

  const hasActiveFilters = query || kind !== "all" || category !== "all" || city !== "all" || sort !== "new";

  return (
    <div>
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.listingsPage.searchPlaceholder}
              className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground sm:w-auto"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {dict.listingsPage.filters}
          </button>
        </div>

        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: "all", label: dict.listingsPage.kindAll },
            ...LISTING_KINDS.map((k) => ({ id: k, label: kindLabel(dict, k) })),
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                const next = opt.id as KindFilter;
                setKind(next);
                // A category the new kind doesn't have would hide everything.
                if (next !== "all" && category !== "all" && !categoriesFor(next).includes(category)) setCategory("all");
              }}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                kind === opt.id
                  ? "btn-brand text-white"
                  : "border border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {filtersOpen && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">
                {dict.listingsPage.categoryLabel}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId | "all")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none"
              >
                <option value="all">{dict.listingsPage.allCategories}</option>
                {categoryOptions.map((id) => (
                  <option key={id} value={id}>
                    {dict.categories[id]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">
                {dict.listingsPage.cityLabel}
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none"
              >
                <option value="all">{dict.listingsPage.allCities}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{formatResultsCount(locale, results.length)}</p>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            aria-label={dict.classifieds.sortNew}
            className="rounded-xl border border-border bg-surface px-2.5 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="new">{dict.classifieds.sortNew}</option>
            <option value="cheap">{dict.classifieds.sortCheap}</option>
            <option value="expensive">{dict.classifieds.sortExpensive}</option>
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              {dict.listingsPage.clearFilters}
            </button>
          )}
          <div className="flex shrink-0 rounded-xl border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-label={dict.map.listView}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === "list" ? "btn-brand text-white" : "text-muted hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{dict.map.listView}</span>
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              aria-label={dict.map.mapView}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === "map" ? "btn-brand text-white" : "text-muted hover:text-foreground"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{dict.map.mapView}</span>
            </button>
          </div>
        </div>
      </div>

      {view === "map" ? (
        <div className="mt-5">
          <ListingsMap listings={results} dict={dict} initialMe={initialFocus} />
        </div>
      ) : results.length > 0 ? (
        <div className="mt-5">
          <ListingsGrid key={`${query}|${kind}|${category}|${city}|${sort}`} listings={results} dict={dict} />
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-lg font-semibold">{dict.listingsPage.noResultsTitle}</p>
          <p className="mt-1.5 max-w-sm text-sm text-muted">{dict.listingsPage.noResultsBody}</p>
        </div>
      )}
    </div>
  );
}
