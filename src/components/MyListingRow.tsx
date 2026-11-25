"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Gift, Loader2, Play, Trash2 } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatTimeAgo } from "@/lib/i18n/format";
import { formatSom } from "@/lib/data";
import ResolveToggleButton from "./ResolveToggleButton";
import { sizedImage } from "@/lib/image-url";
import { kindLabel, priceText, resolvedLabel } from "@/lib/listing-labels";
import { categoryIcons } from "@/lib/icons";

export default function MyListingRow({ listing, dict, locale }: { listing: Listing; dict: Dictionary; locale: Locale }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(dict.myListings.deleteConfirm)) return;
    setDeleting(true);
    const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setDeleting(false);
  }

  const Icon = categoryIcons[listing.category];
  // The first picture, or the video's first frame; with neither, the
  // category's own icon — so every row still shows which listing it is.
  const image = listing.photoUrls[0] ?? listing.videoThumbnailUrl ?? null;
  const isVideo = !listing.photoUrls[0] && !!listing.videoThumbnailUrl;

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <Link
          href={`/elonlar/${listing.id}`}
          aria-label={listing.title}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file (R2 or /api/uploads), not a build-time asset
            <img src={sizedImage(image, 240)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center text-white"
              style={{ backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}, ${listing.colorTo})` }}
            >
              <Icon className="h-6 w-6" />
            </span>
          )}
          {(isVideo || (listing.videoUrl && image)) && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white">
                <Play className="h-3 w-3 fill-white" />
              </span>
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/elonlar/${listing.id}`} className="block truncate text-sm font-semibold hover:underline">
            {listing.title}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted">
            {dict.categories[listing.category]} · {[listing.city, listing.district].filter(Boolean).join(", ")}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
            <span className={listing.kind === "lost" ? "text-danger" : "text-success"}>
              {kindLabel(dict, listing.kind)}
            </span>
            {priceText(dict, listing, locale) && <span className="font-semibold text-foreground">· {priceText(dict, listing, locale)}</span>}
            <span suppressHydrationWarning>· {formatTimeAgo(locale, listing.createdAt)}</span>
            {listing.status === "resolved" && <span>· {resolvedLabel(dict, listing.kind)}</span>}
            {listing.reward ? (
              <span className="flex items-center gap-1 text-accent-gold">
                <Gift className="h-3 w-3" />
                {formatSom(listing.reward, locale)}
              </span>
            ) : null}
          </p>
        </div>
        <Link
          href={`/elonlar/${listing.id}`}
          aria-label={dict.map.viewListing}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={dict.myListings.delete}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-danger hover:bg-danger/10 disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <ResolveToggleButton listingId={listing.id} status={listing.status} kind={listing.kind} dict={dict} />
      </div>
    </div>
  );
}
