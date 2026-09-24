import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar1, Eye, Gift, MapPin } from "lucide-react";
import { formatDate, formatSom } from "@/lib/data";
import { categoryIcons } from "@/lib/icons";
import { getListingById, incrementListingViews } from "@/lib/listings";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { formatViewsCount } from "@/lib/i18n/format";
import ContactCard from "@/components/ContactCard";
import ReportListingButton from "@/components/ReportListingButton";
import ListingGallery from "@/components/ListingGallery";

export async function generateMetadata(props: PageProps<"/elonlar/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const listing = getListingById(id);
  return { title: listing ? `${listing.title} — Findo` : "E'lon topilmadi — Findo" };
}

export default async function ListingDetailPage(props: PageProps<"/elonlar/[id]">) {
  const { id } = await props.params;
  const listing = getListingById(id);
  if (!listing) notFound();

  incrementListingViews(id);
  const user = await getCurrentUser();
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const Icon = categoryIcons[listing.category];
  const categoryLabel = dict.categories[listing.category];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/elonlar"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {dict.listingDetail.backLink}
        </Link>
        <ReportListingButton listingId={listing.id} isLoggedIn={!!user} dict={dict} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                listing.kind === "lost"
                  ? "bg-danger/10 text-danger"
                  : "bg-success/10 text-success"
              }`}
            >
              {listing.kind === "lost" ? dict.common.lost : dict.common.found}
            </span>
            {listing.status === "resolved" && (
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
                {dict.common.resolved}
              </span>
            )}
            {listing.reward ? (
              <span className="flex items-center gap-1 rounded-full bg-accent-gold/15 px-3 py-1 text-xs font-semibold text-accent-gold">
                <Gift className="h-3.5 w-3.5" />
                {formatSom(listing.reward)} {dict.common.rewardSuffix}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {listing.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {listing.city}
              {listing.district ? `, ${listing.district}` : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar1 className="h-4 w-4" />
              {formatDate(listing.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {formatViewsCount(locale, listing.views)}
            </span>
          </div>

          <ListingGallery
            photoUrls={listing.photoUrls}
            title={listing.title}
            colorFrom={listing.colorFrom}
            colorTo={listing.colorTo}
            icon={<Icon className="h-10 w-10" strokeWidth={2} />}
            dict={dict}
          />

          <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {categoryLabel}
            </p>
            <h2 className="mt-2 text-sm font-bold">{dict.listingDetail.descriptionLabel}</h2>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted">
              {listing.description}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <ContactCard name={listing.contactName} phone={listing.contactPhone} dict={dict} />
        </div>
      </div>
    </div>
  );
}
