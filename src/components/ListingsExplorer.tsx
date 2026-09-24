"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { List, Loader2, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import type { CategoryId, Listing, ListingKind } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatResultsCount } from "@/lib/i18n/format";
import { categories, cities } from "@/lib/data";
import { smartSearch } from "@/lib/ai";
import ListingRow from "./ListingRow";

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

export default function ListingsExplorer({
  initialQuery = "",
  initialKind = "all",
  initialCategory = "all",
  initialCity = "all",
  listings,
  dict,
  locale,
}: {
  initialQuery?: string;
  initialKind?: KindFilter;
  initialCategory?: CategoryId | "all";
  initialCity?: string;
  listings: Listing[];
  dict: Dictionary;
  locale: Locale;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<KindFilter>(initialKind);
  const [category, setCategory] = useState<CategoryId | "all">(initialCategory);
  const [city, setCity] = useState<string>(initialCity);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("list");

  const results = useMemo(() => {
    let pool: Listing[] = listings;
    if (kind !== "all") pool = pool.filter((l) => l.kind === kind);
    if (category !== "all") pool = pool.filter((l) => l.category === category);
    if (city !== "all") pool = pool.filter((l) => l.city === city);
    if (query.trim()) pool = smartSearch(query, pool);
    return pool;
  }, [listings, query, kind, category, city]);

  function resetFilters() {
    setQuery("");
    setKind("all");
    setCategory("all");
    setCity("all");
  }

  const hasActiveFilters = query || kind !== "all" || category !== "all" || city !== "all";

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

        <div className="mt-3 flex gap-2">
          {[
            { id: "all", label: dict.listingsPage.kindAll },
            { id: "lost", label: dict.common.lost },
            { id: "found", label: dict.common.found },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setKind(opt.id as KindFilter)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
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
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {dict.categories[c.id]}
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
          <ListingsMap listings={results} dict={dict} />
        </div>
      ) : results.length > 0 ? (
        <div className="mt-5">
          <ListingRow listings={results} dict={dict} />
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
