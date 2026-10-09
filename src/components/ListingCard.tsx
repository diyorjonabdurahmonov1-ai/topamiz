import Link from "next/link";
import { Gift, Play, Sparkles, Tag } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { categoryIcons } from "@/lib/icons";
import { formatSom } from "@/lib/data";
import Avatar from "./Avatar";
import CountdownTimer from "./CountdownTimer";
import { sizedImage } from "@/lib/image-url";

export default function ListingCard({ listing, dict }: { listing: Listing; dict: Dictionary }) {
  const Icon = categoryIcons[listing.category];

  return (
    <div
      className={`card-hover group relative flex flex-col overflow-hidden rounded-xl border bg-surface ${
        listing.isPromo
          ? "border-sky-500/60 ring-1 ring-sky-500/40"
          : listing.isMysteryBox
            ? "border-accent-gold/60 ring-1 ring-accent-gold/40"
            : "border-border"
      }`}
    >
      {/* Full-card "go to listing" link, laid under everything else — the
          owner byline below sits on top of it with pointer-events-auto so
          its own tap goes to the profile instead, without nesting anchors. */}
      <Link
        href={`/elonlar/${listing.id}`}
        aria-label={listing.title}
        className="absolute inset-0 z-0"
      />

      {listing.status === "resolved" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-bg/70 backdrop-blur-[2px]">
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-muted">
            {dict.listingCard.resolved}
          </span>
        </div>
      )}

      <div className="pointer-events-none relative">
        {listing.videoThumbnailUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- hosted on Cloudflare R2, not a build-time asset */}
            <img
              src={listing.videoThumbnailUrl}
              alt={listing.title}
              className="h-28 w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/10">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                <Play className="h-3.5 w-3.5 fill-white" />
              </span>
            </span>
          </>
        ) : listing.photoUrls.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file served from /api/uploads, not a build-time asset
          <img
            src={sizedImage(listing.photoUrls[0], 480)}
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

        {listing.isPromo ? (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-brand-via px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            <Tag className="h-3 w-3" />
            {dict.listingCard.promo}
          </span>
        ) : listing.isMysteryBox ? (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-gold to-brand-via px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            <Sparkles className="h-3 w-3" />
            {dict.listingCard.mysteryBox}
          </span>
        ) : (
          <span
            className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow ${
              listing.kind === "lost"
                ? "bg-danger/90 text-white"
                : "bg-success/90 text-white"
            }`}
          >
            {listing.kind === "lost" ? dict.common.lost : dict.common.found}
          </span>
        )}

        {listing.isMysteryBox && listing.expiresAt ? (
          <CountdownTimer expiresAt={listing.expiresAt} dict={dict} size="compact" />
        ) : listing.reward ? (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-accent-gold px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            <Gift className="h-3 w-3" />
            {formatSom(listing.reward)}
          </span>
        ) : null}

        {listing.ownerId && listing.ownerName && (
          <Link
            href={`/profil/${listing.ownerId}`}
            className="pointer-events-auto absolute inset-x-1 bottom-1 z-20 flex items-center gap-1 rounded-full bg-black/55 py-1 pl-1 pr-2 backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <Avatar
              name={listing.ownerName}
              color={listing.ownerAvatarColor ?? "#6366f1"}
              avatarUrl={listing.ownerAvatarUrl}
              size={16}
            />
            <span className="truncate text-[10px] font-semibold text-white">
              {listing.ownerName}
            </span>
          </Link>
        )}
      </div>

      <div className="pointer-events-none p-2.5">
        <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
          {listing.title}
        </h3>
      </div>
    </div>
  );
}
