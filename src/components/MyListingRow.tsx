"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Gift, Loader2, Trash2 } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { formatSom } from "@/lib/data";
import ResolveToggleButton from "./ResolveToggleButton";
import { sizedImage } from "@/lib/image-url";

export default function MyListingRow({ listing, dict }: { listing: Listing; dict: Dictionary }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(dict.myListings.deleteConfirm)) return;
    setDeleting(true);
    const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setDeleting(false);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
          {listing.photoUrls[0] && (
            // eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file served from /api/uploads, not a build-time asset
            <img src={sizedImage(listing.photoUrls[0], 240)} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{listing.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
            <span className={listing.kind === "lost" ? "text-danger" : "text-success"}>
              {listing.kind === "lost" ? dict.common.lost : dict.common.found}
            </span>
            {listing.status === "resolved" && <span>· {dict.common.resolved}</span>}
            {listing.reward ? (
              <span className="flex items-center gap-1 text-accent-gold">
                <Gift className="h-3 w-3" />
                {formatSom(listing.reward)}
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
        <ResolveToggleButton listingId={listing.id} status={listing.status} dict={dict} />
      </div>
    </div>
  );
}
