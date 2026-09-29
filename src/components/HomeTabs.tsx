"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Gift, Lock, PackageSearch, Search, SearchX, Sparkles } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import ListingsGrid from "@/components/ListingsGrid";

type TabKey = "lost" | "found" | "rewarded" | "mysteryBox";

export default function HomeTabs({
  lost,
  found,
  rewarded,
  mysteryBox,
  mysteryBoxLoggedIn,
  dict,
  mapPreview,
}: {
  lost: Listing[];
  found: Listing[];
  rewarded: Listing[];
  mysteryBox: Listing[];
  // Sirli quti listings are only ever fetched for a signed-in visitor (see
  // the home page) — a guest selecting this tab sees a login prompt instead
  // of the (always empty, for them) grid.
  mysteryBoxLoggedIn: boolean;
  dict: Dictionary;
  mapPreview?: ReactNode;
}) {
  const [active, setActive] = useState<TabKey | null>("lost");

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
      label: dict.tabs.lost,
      icon: Search,
      href: "/elonlar?kind=lost",
      gradient: "linear-gradient(135deg, var(--danger), var(--accent-gold-2))",
      tint: "var(--danger)",
    },
    {
      key: "found",
      label: dict.tabs.found,
      icon: PackageSearch,
      href: "/elonlar?kind=found",
      gradient: "linear-gradient(135deg, var(--success), var(--brand-to))",
      tint: "var(--success)",
    },
    {
      key: "rewarded",
      label: dict.tabs.rewarded,
      icon: Gift,
      href: "/mukofotli",
      gradient: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-2))",
      tint: "var(--accent-gold)",
    },
    {
      key: "mysteryBox",
      label: dict.tabs.mysteryBox,
      icon: Sparkles,
      href: "/sirli-quti",
      gradient: "linear-gradient(135deg, var(--accent-gold), var(--brand-via))",
      tint: "var(--brand-via)",
    },
  ];

  const listingsByTab: Record<TabKey, Listing[]> = { lost, found, rewarded, mysteryBox };
  const activeTab = TABS.find((t) => t.key === active);
  const activeListings = active ? listingsByTab[active] : [];
  const showMysteryBoxLoginPrompt = active === "mysteryBox" && !mysteryBoxLoggedIn;

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
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
            </button>
          );
        })}
      </div>

      {mapPreview}

      {active && activeTab ? (
        <section key={active} className="animate-fade-up mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: activeTab.tint }}
              />
              <h2 className="text-lg font-bold sm:text-xl">
                {activeTab.label} {dict.tabs.itemsSuffix}
              </h2>
            </div>
            {!showMysteryBoxLoginPrompt && (
              <Link
                href={activeTab.href}
                className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-via hover:text-brand-to"
              >
                {dict.tabs.viewAll}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {showMysteryBoxLoginPrompt ? (
            <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-brand-via/30 bg-brand-via/5 py-12 text-center">
              <Lock className="h-7 w-7 text-brand-via" />
              <p className="mt-3 text-sm font-semibold">{dict.mysteryBox.loginRequiredTitle}</p>
              <p className="mt-1 max-w-xs text-sm text-muted">{dict.mysteryBox.loginRequiredBody}</p>
              <Link
                href="/kirish"
                className="btn-brand mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              >
                {dict.nav.login}
              </Link>
            </div>
          ) : activeListings.length > 0 ? (
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
      ) : (
        <p className="animate-fade-up mt-6 text-center text-sm text-muted">{dict.tabs.selectPrompt}</p>
      )}
    </div>
  );
}
