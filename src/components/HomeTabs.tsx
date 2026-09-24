"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Gift, PackageSearch, Search, SearchX } from "lucide-react";
import type { Listing } from "@/lib/types";
import ListingRow from "@/components/ListingRow";

type TabKey = "lost" | "found" | "rewarded";

const TABS: {
  key: TabKey;
  label: string;
  icon: typeof Search;
  href: string;
  gradient: string;
  tint: string;
}[] = [
  {
    key: "lost",
    label: "Yo'qolgan",
    icon: Search,
    href: "/elonlar?kind=lost",
    gradient: "linear-gradient(135deg, var(--danger), var(--accent-gold-2))",
    tint: "var(--danger)",
  },
  {
    key: "found",
    label: "Topilgan",
    icon: PackageSearch,
    href: "/elonlar?kind=found",
    gradient: "linear-gradient(135deg, var(--success), var(--brand-to))",
    tint: "var(--success)",
  },
  {
    key: "rewarded",
    label: "Mukofotli",
    icon: Gift,
    href: "/mukofotli",
    gradient: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-2))",
    tint: "var(--accent-gold)",
  },
];

export default function HomeTabs({
  lost,
  found,
  rewarded,
  lostCount,
  foundCount,
  rewardedCount,
}: {
  lost: Listing[];
  found: Listing[];
  rewarded: Listing[];
  lostCount: number;
  foundCount: number;
  rewardedCount: number;
}) {
  const [active, setActive] = useState<TabKey | null>(null);

  const listingsByTab: Record<TabKey, Listing[]> = { lost, found, rewarded };
  const countByTab: Record<TabKey, number> = {
    lost: lostCount,
    found: foundCount,
    rewarded: rewardedCount,
  };
  const activeTab = TABS.find((t) => t.key === active);
  const activeListings = active ? listingsByTab[active] : [];

  return (
    <div className="mt-8">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive((current) => (current === tab.key ? null : tab.key))}
              style={
                isActive
                  ? {
                      borderColor: `color-mix(in srgb, ${tab.tint} 55%, var(--border))`,
                      backgroundColor: `color-mix(in srgb, ${tab.tint} 8%, var(--surface))`,
                      boxShadow: `0 12px 28px -14px color-mix(in srgb, ${tab.tint} 55%, transparent)`,
                    }
                  : {
                      borderColor: `color-mix(in srgb, ${tab.tint} 22%, var(--border))`,
                      backgroundColor: `color-mix(in srgb, ${tab.tint} 4%, var(--surface))`,
                      boxShadow: `0 8px 20px -16px color-mix(in srgb, ${tab.tint} 40%, transparent)`,
                    }
              }
              className="card-hover flex flex-col items-center gap-2.5 rounded-2xl border px-3 py-5 text-center"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md sm:h-12 sm:w-12"
                style={{ backgroundImage: tab.gradient }}
              >
                <tab.icon className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span
                className="text-xs font-bold leading-tight sm:text-sm"
                style={isActive ? { color: tab.tint } : undefined}
              >
                {tab.label}
              </span>
              <span className="text-[11px] font-medium text-muted">
                {countByTab[tab.key]} ta e&apos;lon
              </span>
            </button>
          );
        })}
      </div>

      {active && activeTab ? (
        <section key={active} className="animate-fade-up mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: activeTab.tint }}
              />
              <h2 className="text-lg font-bold sm:text-xl">{activeTab.label} buyumlar</h2>
            </div>
            <Link
              href={activeTab.href}
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-via hover:text-brand-to"
            >
              Barchasini ko'rish
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {activeListings.length > 0 ? (
            <div className="mt-5">
              <ListingRow listings={activeListings} />
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface py-12 text-center">
              <SearchX className="h-7 w-7 text-muted" />
              <p className="mt-3 text-sm font-semibold">Hozircha e'lonlar yo'q</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Bu bo'limda hali hech kim e'lon joylashtirmagan.
              </p>
            </div>
          )}
        </section>
      ) : (
        <p className="animate-fade-up mt-6 text-center text-sm text-muted">
          E&apos;lonlarni ko&apos;rish uchun yuqoridagi bo&apos;limlardan birini tanlang
        </p>
      )}
    </div>
  );
}
