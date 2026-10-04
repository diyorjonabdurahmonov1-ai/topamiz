import Link from "next/link";
import { Navigation, QrCode, Search, Sparkles } from "lucide-react";
import type { CategoryId, Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { categoryIcons } from "@/lib/icons";
import { formatSom } from "@/lib/data";

const QUICK_CATEGORIES: { id: CategoryId; color: string; label: (dict: Dictionary) => string }[] = [
  { id: "hujjatlar", color: "#2563eb", label: (dict) => dict.homeQuickAccess.categoryHujjatlar },
  { id: "texnika", color: "#1e293b", label: (dict) => dict.homeQuickAccess.categoryTelefon },
  { id: "kalitlar", color: "#c2410c", label: (dict) => dict.homeQuickAccess.categoryKalitlar },
  { id: "sumka", color: "#78350f", label: (dict) => dict.homeQuickAccess.categoryHamyon },
  { id: "hayvonlar", color: "#15803d", label: (dict) => dict.homeQuickAccess.categoryHayvon },
];

export default function HomeQuickAccess({
  dict,
  mysteryBoxTeaser,
}: {
  dict: Dictionary;
  mysteryBoxTeaser: Listing | null;
}) {
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

      <div className="flex justify-between gap-1 overflow-x-auto sm:justify-center sm:gap-8">
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
        <Link
          href="/elonlar?view=map"
          className="card-hover relative row-span-2 flex min-h-[150px] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-surface-2 p-4"
        >
          <Navigation className="absolute right-4 top-4 h-5 w-5 text-brand-via" />
          <p className="text-sm font-bold">{dict.homeQuickAccess.nearbyTitle}</p>
          <p className="text-xs text-muted">{dict.listingDetail.showOnMap}</p>
        </Link>

        {mysteryBoxTeaser ? (
          <Link
            href="/sirli-quti"
            className="card-hover flex flex-col gap-1 rounded-2xl p-4 text-black"
            style={{ backgroundImage: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-2))" }}
          >
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" />
              {dict.mysteryBox.activeCount}
            </span>
            {typeof mysteryBoxTeaser.reward === "number" && (
              <span className="text-lg font-extrabold">{formatSom(mysteryBoxTeaser.reward)}</span>
            )}
            <span className="text-xs font-semibold">{mysteryBoxTeaser.city}</span>
          </Link>
        ) : (
          <Link
            href="/sirli-quti"
            className="card-hover flex flex-col justify-center gap-1 rounded-2xl border border-border bg-surface-2 p-4"
          >
            <Sparkles className="h-4 w-4 text-brand-via" />
            <p className="text-sm font-bold">{dict.homeQuickAccess.mysteryBoxEmptyTitle}</p>
            <p className="text-[11px] text-muted">{dict.homeQuickAccess.mysteryBoxEmptySubtitle}</p>
          </Link>
        )}

        <Link
          href="/belgilash"
          className="card-hover flex flex-col justify-center gap-1.5 rounded-2xl border border-border bg-surface p-4"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-via/15 text-brand-via">
            <QrCode className="h-3.5 w-3.5" />
          </span>
          <p className="text-sm font-bold">{dict.homeQuickAccess.qrTitle}</p>
          <p className="text-[11px] text-muted">{dict.homeQuickAccess.qrSubtitle}</p>
        </Link>
      </div>
    </div>
  );
}
