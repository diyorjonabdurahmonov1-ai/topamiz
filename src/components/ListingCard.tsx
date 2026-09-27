import Link from "next/link";
import { Gift } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { categoryIcons } from "@/lib/icons";
import { formatSom } from "@/lib/data";

export default function ListingCard({ listing, dict }: { listing: Listing; dict: Dictionary }) {
  const Icon = categoryIcons[listing.category];

  return (
    <Link
      href={`/elonlar/${listing.id}`}
      className="card-hover group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface"
    >
      {listing.status === "resolved" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg/70 backdrop-blur-[2px]">
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-muted">
            {dict.listingCard.resolved}
          </span>
        </div>
      )}

      <div className="relative">
        {listing.photoUrls.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file served from /api/uploads, not a build-time asset
          <img
            src={listing.photoUrls[0]}
            alt={listing.title}
            className="h-28 w-full object-cover"
          />
        ) : (
          <div
            className="flex h-28 items-center justify-center"
            style={{
              backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}22, ${listing.colorTo}22)`,
            }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
              style={{
                backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}, ${listing.colorTo})`,
              }}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        )}

        <span
          className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow ${
            listing.kind === "lost"
              ? "bg-danger/90 text-white"
              : "bg-success/90 text-white"
          }`}
        >
          {listing.kind === "lost" ? dict.common.lost : dict.common.found}
        </span>

        {listing.reward ? (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-accent-gold px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            <Gift className="h-3 w-3" />
            {formatSom(listing.reward)}
          </span>
        ) : null}
      </div>

      <div className="p-2.5">
        <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
          {listing.title}
        </h3>
      </div>
    </Link>
  );
}
