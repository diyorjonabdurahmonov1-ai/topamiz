import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
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
import NearbyMapCard from "@/components/NearbyMapCard";
import HomeHero from "@/components/HomeHero";
import HomeListingCard from "@/components/HomeListingCard";

const QUICK_CATEGORIES: { id: CategoryId; label: (dict: Dictionary) => string }[] = [
  { id: "hujjatlar", label: (dict) => dict.homeQuickAccess.categoryHujjatlar },
  { id: "texnika", label: (dict) => dict.homeQuickAccess.categoryTelefon },
  { id: "kalitlar", label: (dict) => dict.homeQuickAccess.categoryKalitlar },
  { id: "sumka", label: (dict) => dict.homeQuickAccess.categoryHamyon },
  { id: "hayvonlar", label: (dict) => dict.homeQuickAccess.categoryHayvon },
  { id: "kiyim", label: (dict) => dict.homeQuickAccess.categoryKiyim },
  { id: "boshqa", label: (dict) => dict.homeQuickAccess.categoryBoshqa },
];

export default function HomeQuickAccess({
  dict,
  locale,
  ads,
  nearby,
  recent,
  promoCount,
}: {
  dict: Dictionary;
  locale: Locale;
  ads: AdBanner[];
  nearby: Listing[];
  recent: Listing[];
  promoCount: number;
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
        {QUICK_CATEGORIES.map(({ id, label }) => {
          const Icon = categoryIcons[id];
          return (
            <CategoryTile key={id} href={`/elonlar?category=${id}`} label={label(dict)}>
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </CategoryTile>
          );
        })}
      </div>

      <HomeHero ads={ads} dict={dict} />

      <div className="grid grid-cols-2 gap-3">
        <KindCard
          href="/elonlar?kind=lost"
          title={t.lostCardTitle}
          subtitle={t.lostCardSubtitle}
          icon={<Search className="h-5 w-5" />}
          tone="bg-orange-500/10 dark:bg-orange-400/10"
          iconTone="bg-orange-500/15 text-orange-600 dark:text-orange-300"
        />
        <KindCard
          href="/elonlar?kind=found"
          title={t.foundCardTitle}
          subtitle={t.foundCardSubtitle}
          icon={<PackageSearch className="h-5 w-5" />}
          tone="bg-sky-500/10 dark:bg-sky-400/10"
          iconTone="bg-sky-500/15 text-sky-600 dark:text-sky-300"
        />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <ExtraTile href="/takliflar" icon={<Tag className="h-4 w-4" />} gradient="from-sky-500 to-brand-via" title={dict.promo.title}>
          {promoCount > 0 ? `${promoCount} · ${dict.promo.activeCount}` : t.promoSubtitle}
        </ExtraTile>
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
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 text-center">
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-transform active:scale-95 ${
          active
            ? "bg-gradient-to-br from-brand-from to-brand-via text-white shadow-lg shadow-brand-via/30"
            : "border border-border bg-surface text-foreground shadow-sm"
        }`}
      >
        {children}
      </span>
      <span className={`line-clamp-1 text-[11px] font-semibold ${active ? "text-foreground" : "text-muted"}`}>{label}</span>
    </Link>
  );
}

function KindCard({
  href,
  title,
  subtitle,
  icon,
  tone,
  iconTone,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: string;
  iconTone: string;
}) {
  return (
    <Link href={href} className={`card-hover relative flex flex-col rounded-2xl border border-border p-4 ${tone}`}>
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${iconTone}`}>{icon}</span>
      <span className="mt-3 text-sm font-extrabold sm:text-base">{title}</span>
      <span className="mt-0.5 pr-8 text-[11px] leading-snug text-muted sm:text-xs">{subtitle}</span>
      <span className="absolute bottom-4 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated/80 text-foreground shadow-sm">
        <ChevronRight className="h-4 w-4" />
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
