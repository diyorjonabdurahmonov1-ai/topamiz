import Link from "next/link";
import { Clock, Gift, Heart, MapPin, Play, Sparkles, Tag } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { categoryIcons } from "@/lib/icons";
import { formatSom } from "@/lib/data";
import { formatTimeAgo } from "@/lib/i18n/format";
import { sizedImage } from "@/lib/image-url";

// The home page's "latest listings" card: a bigger photo than the grid card,
// plus where and how long ago — enough to tell at a glance whether it's
// worth opening.
export default function HomeListingCard({
  listing,
  dict,
  locale,
}: {
  listing: Listing;
  dict: Dictionary;
  locale: Locale;
}) {
  const Icon = categoryIcons[listing.category];
  const image = listing.videoThumbnailUrl ?? listing.photoUrls[0] ?? null;
  const place = [listing.city, listing.district].filter(Boolean).join(", ");

  return (
    <Link
      href={`/elonlar/${listing.id}`}
      className="card-hover flex w-44 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-surface sm:w-auto"
    >
      <div className="relative h-32 w-full overflow-hidden bg-surface-2">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file (R2 or /api/uploads), not a build-time asset
          <img src={sizedImage(image, 480)} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}26, ${listing.colorTo}26)` }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{ backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}, ${listing.colorTo})` }}
            >
              <Icon className="h-6 w-6" />
            </span>
          </div>
        )}
        {listing.videoThumbnailUrl && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
              <Play className="h-4 w-4 fill-white" />
            </span>
          </span>
        )}

        {listing.isPromo ? (
          <Badge className="bg-gradient-to-r from-sky-500 to-brand-via">
            <Tag className="h-3 w-3" />
            {dict.listingCard.promo}
          </Badge>
        ) : listing.isMysteryBox ? (
          <Badge className="bg-gradient-to-r from-accent-gold to-brand-via">
            <Sparkles className="h-3 w-3" />
            {dict.listingCard.mysteryBox}
          </Badge>
        ) : (
          <Badge className={listing.kind === "lost" ? "bg-danger" : "bg-sky-500"}>
            {listing.kind === "lost" ? dict.common.lost : dict.common.found}
          </Badge>
        )}

        {listing.likeCount > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            <Heart className="h-3 w-3 fill-white" />
            {listing.likeCount}
          </span>
        )}
        {listing.reward ? (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-accent-gold px-2 py-0.5 text-[10px] font-bold text-white shadow">
            <Gift className="h-3 w-3" />
            {formatSom(listing.reward)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 text-sm font-bold">{listing.title}</h3>
        {place && (
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <MapPin className="h-3 w-3 shrink-0 text-danger" />
            <span className="truncate">{place}</span>
          </p>
        )}
        <p className="flex items-center gap-1 text-[11px] text-muted">
          <Clock className="h-3 w-3 shrink-0" />
          <span suppressHydrationWarning>{formatTimeAgo(locale, listing.createdAt)}</span>
        </p>
      </div>
    </Link>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`absolute left-2 top-2 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow ${className}`}
    >
      {children}
    </span>
  );
}
