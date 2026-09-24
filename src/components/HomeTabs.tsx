"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Gift, PackageSearch, Search } from "lucide-react";
import type { Listing } from "@/lib/types";
import ListingCard from "@/components/ListingCard";

type TabKey = "lost" | "found" | "rewarded";

const TABS: { key: TabKey; label: string; icon: typeof Search; href: string }[] = [
  { key: "lost", label: "Yo'qolgan buyumlar", icon: Search, href: "/elonlar?kind=lost" },
  { key: "found", label: "Topilgan buyumlar", icon: PackageSearch, href: "/elonlar?kind=found" },
  { key: "rewarded", label: "Mukofotli buyumlar", icon: Gift, href: "/mukofotli" },
];

export default function HomeTabs({
  lost,
  found,
  rewarded,
}: {
  lost: Listing[];
  found: Listing[];
  rewarded: Listing[];
}) {
  const [active, setActive] = useState<TabKey | null>(null);

  const listingsByTab: Record<TabKey, Listing[]> = { lost, found, rewarded };
  const activeTab = TABS.find((t) => t.key === active);
  const activeListings = active ? listingsByTab[active] : [];

  return (
    <div className="mt-8">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive((current) => (current === tab.key ? null : tab.key))}
              className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition-colors ${
                isActive
                  ? "border-brand-via bg-brand-via/10 text-brand-via"
                  : "border-border bg-surface text-foreground hover:border-brand-via/40"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs font-semibold leading-tight sm:text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {active && activeTab ? (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold sm:text-xl">{activeTab.label}</h2>
            <Link
              href={activeTab.href}
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-via hover:text-brand-to"
            >
              Barchasini ko'rish
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {activeListings.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {activeListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
              Hozircha e&apos;lonlar yo&apos;q.
            </p>
          )}
        </section>
      ) : (
        <p className="mt-6 text-center text-sm text-muted">
          E&apos;lonlarni ko&apos;rish uchun yuqoridagi bo&apos;limlardan birini tanlang
        </p>
      )}
    </div>
  );
}
