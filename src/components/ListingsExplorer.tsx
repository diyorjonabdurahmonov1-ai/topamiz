"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { CategoryId, Listing, ListingKind } from "@/lib/types";
import { categories, cities, listings } from "@/lib/data";
import { smartSearch } from "@/lib/ai";
import ListingCard from "./ListingCard";

type KindFilter = "all" | ListingKind;

export default function ListingsExplorer({
  initialQuery = "",
  initialKind = "all",
  initialCategory = "all",
  initialCity = "all",
}: {
  initialQuery?: string;
  initialKind?: KindFilter;
  initialCategory?: CategoryId | "all";
  initialCity?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<KindFilter>(initialKind);
  const [category, setCategory] = useState<CategoryId | "all">(initialCategory);
  const [city, setCity] = useState<string>(initialCity);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useMemo(() => {
    let pool: Listing[] = listings.filter((l) => l.status === "active");
    if (kind !== "all") pool = pool.filter((l) => l.kind === kind);
    if (category !== "all") pool = pool.filter((l) => l.category === category);
    if (city !== "all") pool = pool.filter((l) => l.city === city);
    if (query.trim()) pool = smartSearch(query, pool);
    return pool;
  }, [query, kind, category, city]);

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
              placeholder="Qidiruv: hujjat, telefon, mushuk..."
              className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground sm:w-auto"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrlar
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {[
            { id: "all", label: "Barchasi" },
            { id: "lost", label: "Yo'qoldi" },
            { id: "found", label: "Topildi" },
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
              <label className="mb-1.5 block text-xs font-semibold text-muted">Turkum</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId | "all")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none"
              >
                <option value="all">Barcha turkumlar</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">Shahar</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none"
              >
                <option value="all">Barcha shaharlar</option>
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

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">{results.length}</span> ta e'lon
          topildi
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Filtrlarni tozalash
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-lg font-semibold">Hech narsa topilmadi</p>
          <p className="mt-1.5 max-w-sm text-sm text-muted">
            Boshqa kalit so'z bilan qidiring yoki filtrlarni tozalab qayta
            urinib ko'ring.
          </p>
        </div>
      )}
    </div>
  );
}
