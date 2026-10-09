"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, PackageSearch, QrCode, Search, SearchX, Tag } from "lucide-react";
import type { CategoryId, Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { categoryIcons } from "@/lib/icons";
import NearbyMapCard from "@/components/NearbyMapCard";
import HomeTabCard from "@/components/HomeTabCard";
import ListingsGrid from "@/components/ListingsGrid";

type HomeTabKey = "lost" | "found";

const QUICK_CATEGORIES: { id: CategoryId; color: string; label: (dict: Dictionary) => string }[] = [
  { id: "hujjatlar", color: "#2563eb", label: (dict) => dict.homeQuickAccess.categoryHujjatlar },
  { id: "texnika", color: "#1e293b", label: (dict) => dict.homeQuickAccess.categoryTelefon },
  { id: "kalitlar", color: "#c2410c", label: (dict) => dict.homeQuickAccess.categoryKalitlar },
  { id: "sumka", color: "#78350f", label: (dict) => dict.homeQuickAccess.categoryHamyon },
  { id: "hayvonlar", color: "#15803d", label: (dict) => dict.homeQuickAccess.categoryHayvon },
  { id: "kiyim", color: "#be185d", label: (dict) => dict.homeQuickAccess.categoryKiyim },
  { id: "boshqa", color: "#475569", label: (dict) => dict.homeQuickAccess.categoryBoshqa },
];

export default function HomeQuickAccess({
  dict,
  nearby,
  lost,
  found,
  promoCount,
}: {
  dict: Dictionary;
  nearby: Listing[];
  lost: Listing[];
  found: Listing[];
  promoCount: number;
}) {
  const [activeTab, setActiveTab] = useState<HomeTabKey>("lost");
  const activeListings = activeTab === "lost" ? lost : found;
  const activeHref = activeTab === "lost" ? "/elonlar?kind=lost" : "/elonlar?kind=found";
  const activeLabel = activeTab === "lost" ? dict.tabs.lost : dict.tabs.found;

  return (
    <div className="mt-6 space-y-4">
      <form action="/elonlar" className="flex items-center gap-2 rounded-2xl border border-border bg-surface pl-4 pr-1.5 py-1.5">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          type="text"
          name="q"
          placeholder={dict.listingsPage.searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label={dict.homeQuickAccess.searchButtonLabel}
          className="btn-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      <div className="scrollbar-thin -mx-4 flex gap-5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {QUICK_CATEGORIES.map(({ id, color, label }) => {
          const Icon = categoryIcons[id];
          return (
            <Link
              key={id}
              href={`/elonlar?category=${id}`}
              className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                <Icon className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span className="line-clamp-1 text-[11px] font-semibold text-muted">{label(dict)}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <HomeTabCard
          active={activeTab === "lost"}
          label={dict.tabs.lost}
          icon={Search}
          gradient="linear-gradient(135deg, var(--danger), var(--accent-gold-2))"
          onClick={() => setActiveTab("lost")}
        />
        <HomeTabCard
          active={activeTab === "found"}
          label={dict.tabs.found}
          icon={PackageSearch}
          gradient="linear-gradient(135deg, var(--success), var(--brand-to))"
          onClick={() => setActiveTab("found")}
        />

        <NearbyMapCard listings={nearby} dict={dict} />

        <Link
          href="/takliflar"
          className="card-hover flex flex-col justify-center gap-1 rounded-2xl p-4 text-white"
          style={{ backgroundImage: "linear-gradient(135deg, #0ea5e9, var(--brand-via))" }}
        >
          <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide">
            <Tag className="h-3 w-3" />
            {dict.promo.title}
          </span>
          <span className="text-lg font-extrabold">{promoCount}</span>
          <span className="text-xs font-semibold">{dict.promo.activeCount}</span>
        </Link>

        <Link
          href="/belgilash"
          className="card-hover col-span-2 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-from to-brand-via text-white shadow-lg">
            <QrCode className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold">{dict.homeQuickAccess.qrTitle}</span>
            <span className="block text-xs text-muted">{dict.homeQuickAccess.qrSubtitle}</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
        </Link>
      </div>

      <section className="animate-fade-up">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl">
            {activeLabel} {dict.tabs.itemsSuffix}
          </h2>
          <Link
            href={activeHref}
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-via hover:text-brand-to"
          >
            {dict.tabs.viewAll}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {activeListings.length > 0 ? (
          <div className="mt-5">
            <ListingsGrid listings={activeListings} dict={dict} />
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface py-12 text-center">
            <SearchX className="h-7 w-7 text-muted" />
            <p className="mt-3 text-sm font-semibold">{dict.tabs.emptyTitle}</p>
            <p className="mt-1 max-w-xs text-sm text-muted">{dict.tabs.emptyBody}</p>
          </div>
        )}
      </section>
    </div>
  );
}
