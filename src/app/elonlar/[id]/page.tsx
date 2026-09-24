import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar1, Eye, Gift, MapPin } from "lucide-react";
import { categories, formatDate, formatSom } from "@/lib/data";
import { categoryIcons } from "@/lib/icons";
import { findMatches } from "@/lib/ai";
import { getAllActiveListings, getListingById, incrementListingViews } from "@/lib/listings";
import { getCurrentUser } from "@/lib/auth";
import AiMatches from "@/components/AiMatches";
import ContactCard from "@/components/ContactCard";
import ReportListingButton from "@/components/ReportListingButton";

export async function generateMetadata(props: PageProps<"/elonlar/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const listing = getListingById(id);
  return { title: listing ? `${listing.title} — Topamiz` : "E'lon topilmadi — Topamiz" };
}

export default async function ListingDetailPage(props: PageProps<"/elonlar/[id]">) {
  const { id } = await props.params;
  const listing = getListingById(id);
  if (!listing) notFound();

  incrementListingViews(id);
  const user = await getCurrentUser();
  const Icon = categoryIcons[listing.category];
  const categoryLabel = categories.find((c) => c.id === listing.category)?.label ?? "";
  const matches = findMatches(listing, getAllActiveListings());

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/elonlar"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Barcha e'lonlar
        </Link>
        <ReportListingButton listingId={listing.id} isLoggedIn={!!user} />
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
              {listing.kind === "lost" ? "Yo'qoldi" : "Topildi"}
            </span>
            {listing.status === "resolved" && (
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
                Hal qilindi
              </span>
            )}
            {listing.reward ? (
              <span className="flex items-center gap-1 rounded-full bg-accent-gold/15 px-3 py-1 text-xs font-semibold text-accent-gold">
                <Gift className="h-3.5 w-3.5" />
                {formatSom(listing.reward)} mukofot
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
              {listing.views} marta ko'rilgan
            </span>
          </div>

          {listing.photoUrls.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file served from /api/uploads, not a build-time asset
            <img
              src={listing.photoUrls[0]}
              alt={listing.title}
              className="mt-6 h-56 w-full rounded-2xl object-cover sm:h-64"
            />
          ) : (
            <div
              className="mt-6 flex h-56 items-center justify-center rounded-2xl sm:h-64"
              style={{
                backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}22, ${listing.colorTo}22)`,
              }}
            >
              <div
                className="flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-xl"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}, ${listing.colorTo})`,
                }}
              >
                <Icon className="h-10 w-10" strokeWidth={2} />
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {categoryLabel}
            </p>
            <h2 className="mt-2 text-sm font-bold">Tavsif</h2>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted">
              {listing.description}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <ContactCard name={listing.contactName} phone={listing.contactPhone} />
          <AiMatches matches={matches} />
        </div>
      </div>
    </div>
  );
}
