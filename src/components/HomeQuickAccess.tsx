import Link from "next/link";
import {
  ArrowRight,
  KeyRound,
  LayoutGrid,
  MapPin,
  PackageSearch,
  QrCode,
  Search,
  SearchX,
  SlidersHorizontal,
  Sparkles,
  Tag,
} from "lucide-react";
import type { CategoryId, Listing } from "@/lib/types";
import type { AdBanner } from "@/lib/ads";
import type { Dictionary, Locale } from "@/lib/i18n";
import { categoryIcons } from "@/lib/icons";
import { CATEGORY_COLORS } from "@/lib/category-colors";
import NearbyMapCard from "@/components/NearbyMapCard";
import HomeHero from "@/components/HomeHero";
import HomeListingCard from "@/components/HomeListingCard";

// The home page's one row of sections, swiped sideways: lost & found first
// and tinted (where Findo started, and still what it's known for), then the
// classifieds categories people come for most, with renting and businesses'
// offers as entries of their own.
type Special = "rent" | "promo" | "lost" | "found";
type Section = { category: CategoryId } | { special: Special };

const SECTIONS: Section[] = [
  { special: "lost" },
  { special: "found" },
  { category: "transport" },
  { category: "kochmas_mulk" },
  { special: "rent" },
  { category: "ish" },
  { category: "xizmatlar" },
  { category: "texnika" },
  { category: "uy_rozgor" },
  { category: "kiyim" },
  { category: "bolalar" },
  { category: "hayvonlar" },
  { category: "sport" },
  { special: "promo" },
];

const SPECIAL_TILES: Record<
  Special,
  { href: string; Icon: typeof Search; color: string; label: (d: Dictionary) => string; tint?: string }
> = {
  rent: { href: "/elonlar?kind=rent", Icon: KeyRound, color: "text-teal-500", label: (d) => d.classifieds.kindRent },
  promo: { href: "/takliflar", Icon: Tag, color: "text-pink-500", label: (d) => d.promo.title },
  lost: {
    href: "/elonlar?kind=lost",
    Icon: Search,
    color: "text-orange-500",
    label: (d) => d.tabs.lost,
    tint: "border-orange-500/40 bg-orange-500/10",
  },
  found: {
    href: "/elonlar?kind=found",
    Icon: PackageSearch,
    color: "text-sky-500",
    label: (d) => d.tabs.found,
    tint: "border-sky-500/40 bg-sky-500/10",
  },
};

export default function HomeQuickAccess({
  dict,
  locale,
  ads,
  nearby,
  recent,
}: {
  dict: Dictionary;
  locale: Locale;
  ads: AdBanner[];
  nearby: Listing[];
  recent: Listing[];
}) {
  const t = dict.homeQuickAccess;

  return (
    <div className="space-y-5">
      <form
        action="/elonlar"
        className="flex items-center gap-2 rounded-2xl border border-border bg-surface py-1.5 pl-4 pr-1.5 shadow-sm"
      >
        <Search className="h-5 w-5 shrink-0 text-muted" />
        <input
          type="text"
          name="q"
          placeholder={dict.listingsPage.searchPlaceholder}
          aria-label={t.searchButtonLabel}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted"
        />
        <Link
          href="/elonlar"
          aria-label={dict.listingsPage.allCategories}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Link>
      </form>

      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        <CategoryTile href="/elonlar" label={dict.listingsPage.kindAll} active>
          <LayoutGrid className="h-6 w-6" />
        </CategoryTile>
        {SECTIONS.map((section) => {
          if ("special" in section) {
            const { href, Icon, color, label, tint } = SPECIAL_TILES[section.special];
            return (
              <CategoryTile key={section.special} href={href} label={label(dict)} tint={tint}>
                <Icon className={`h-6 w-6 ${color}`} strokeWidth={1.75} />
              </CategoryTile>
            );
          }
          const Icon = categoryIcons[section.category];
          return (
            <CategoryTile key={section.category} href={`/elonlar?category=${section.category}`} label={dict.categories[section.category]}>
              <Icon className="h-6 w-6" strokeWidth={1.75} style={{ color: CATEGORY_COLORS[section.category].from }} />
            </CategoryTile>
          );
        })}
      </div>

      <HomeHero ads={ads} dict={dict} />

      <div className="flex items-center gap-3 rounded-2xl border border-orange-500/25 bg-gradient-to-r from-orange-500/10 to-sky-500/10 p-3">
        <p className="min-w-0 flex-1 text-[13px] font-bold leading-snug">{dict.classifieds.lostFoundPrompt}</p>
        <div className="flex shrink-0 gap-1.5">
          <Link
            href="/elon-qoshish?kind=lost"
            className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-2 text-xs font-bold text-white shadow-sm active:scale-95"
          >
            <Search className="h-3.5 w-3.5" />
            {dict.classifieds.iLost}
          </Link>
          <Link
            href="/elon-qoshish?kind=found"
            className="flex items-center gap-1 rounded-full bg-sky-500 px-3 py-2 text-xs font-bold text-white shadow-sm active:scale-95"
          >
            <PackageSearch className="h-3.5 w-3.5" />
            {dict.classifieds.iFound}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <ExtraTile href="/sirli-quti" icon={<Sparkles className="h-4 w-4" />} gradient="from-accent-gold to-brand-via" title={dict.nav.mysteryBox}>
          {t.mysteryBoxSubtitle}
        </ExtraTile>
        <ExtraTile href="/belgilash" icon={<QrCode className="h-4 w-4" />} gradient="from-brand-from to-brand-via" title={t.qrTitle}>
          {t.qrSubtitle}
        </ExtraTile>
      </div>

      <section className="rounded-3xl border border-border bg-surface p-3 sm:p-4">
        <SectionHeader
          icon={<MapPin className="h-4 w-4 text-brand-via" />}
          title={t.nearbyTitle}
          href="/elonlar?view=map"
          linkLabel={dict.listingDetail.showOnMap}
        />
        <NearbyMapCard listings={nearby} dict={dict} labelled={false} className="mt-3 h-44 sm:h-64" />
      </section>

      <section>
        <SectionHeader title={t.recentTitle} href="/elonlar" linkLabel={dict.tabs.viewAll} />
        {recent.length > 0 ? (
          <div className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden">
            {recent.map((listing) => (
              <HomeListingCard key={listing.id} listing={listing} dict={dict} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface py-12 text-center">
            <SearchX className="h-7 w-7 text-muted" />
            <p className="mt-3 text-sm font-semibold">{dict.tabs.emptyTitle}</p>
            <p className="mt-1 max-w-xs text-sm text-muted">{dict.tabs.emptyBody}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryTile({
  href,
  label,
  active = false,
  tint,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  // A coloured background that singles the tile out from the plain ones.
  tint?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 text-center">
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-transform active:scale-95 ${
          active
            ? "bg-gradient-to-br from-brand-from to-brand-via text-white shadow-lg shadow-brand-via/30"
            : `border shadow-sm ${tint ?? "border-border bg-surface"} text-foreground`
        }`}
      >
        {children}
      </span>
      <span
        className={`line-clamp-2 text-[11px] font-semibold leading-tight ${active || tint ? "text-foreground" : "text-muted"}`}
      >
        {label}
      </span>
    </Link>
  );
}

function ExtraTile({
  href,
  icon,
  gradient,
  title,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  gradient: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="card-hover flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
      <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow ${gradient}`}>
        {icon}
      </span>
      <span>
        <span className="line-clamp-1 block text-xs font-extrabold">{title}</span>
        <span className="line-clamp-2 block text-[10px] leading-snug text-muted">{children}</span>
      </span>
    </Link>
  );
}

function SectionHeader({
  icon,
  title,
  href,
  linkLabel,
}: {
  icon?: React.ReactNode;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5 text-base font-extrabold sm:text-lg">
        {icon}
        {title}
      </h2>
      <Link href={href} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-via hover:text-brand-to sm:text-sm">
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
