"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Gift, Loader2, Trash2 } from "lucide-react";
import type { Listing } from "@/lib/types";
import { formatDate, formatSom } from "@/lib/data";
import { countryName } from "@/lib/country-names";

export default function AdminListingRow({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${listing.title}" e'lonini o'chirmoqchimisiz?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/listings/${listing.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setDeleting(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
        {listing.photoUrls[0] && (
          // eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file served from /api/uploads, not a build-time asset
          <img src={listing.photoUrls[0]} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{listing.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <span className={listing.kind === "lost" ? "text-danger" : "text-success"}>
            {listing.kind === "lost" ? "Yo'qoldi" : "Topildi"}
          </span>
          <span>· {countryName(listing.country)}</span>
          <span>· {listing.city}</span>
          {listing.status === "resolved" && <span>· Yechildi</span>}
          {listing.reward ? (
            <span className="flex items-center gap-1 text-accent-gold">
              <Gift className="h-3 w-3" />
              {formatSom(listing.reward)}
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-xs text-muted">{formatDate(listing.date)}</p>
      </div>
      <Link
        href={`/elonlar/${listing.id}`}
        target="_blank"
        aria-label="E'lonni ko'rish"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="E'lonni o'chirish"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-danger hover:bg-danger/10 disabled:opacity-60"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
