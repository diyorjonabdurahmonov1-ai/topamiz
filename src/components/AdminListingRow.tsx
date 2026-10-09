"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Gift, Loader2, Sparkles, Trash2 } from "lucide-react";
import type { Listing } from "@/lib/types";
import { formatDate, formatSom } from "@/lib/data";
import { countryName } from "@/lib/country-names";
import { sizedImage } from "@/lib/image-url";

export default function AdminListingRow({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [togglingMysteryBox, setTogglingMysteryBox] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${listing.title}" e'lonini o'chirmoqchimisiz?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/listings/${listing.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setDeleting(false);
  }

  async function handleToggleMysteryBox() {
    setTogglingMysteryBox(true);
    const res = await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isMysteryBox: !listing.isMysteryBox }),
    });
    if (res.ok) router.refresh();
    else setTogglingMysteryBox(false);
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
              {listing.kind === "lost" ? "Yo'qoldi" : "Topildi"}
            </span>
            <span>· {countryName(listing.country)}</span>
            <span>· {listing.city}</span>
            {listing.status === "resolved" && <span>· Yechildi</span>}
            {listing.isMysteryBox && <span className="text-accent-gold">· Sirli quti</span>}
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

      <div className="mt-3 border-t border-border pt-3">
        <button
          type="button"
          onClick={handleToggleMysteryBox}
          disabled={togglingMysteryBox}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-70 ${
            listing.isMysteryBox
              ? "border-border text-muted hover:text-foreground"
              : "border-accent-gold/40 bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20"
          }`}
        >
          {togglingMysteryBox ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {listing.isMysteryBox ? "Sirli qutidan chiqarish" : "Sirli quti qilish"}
        </button>
      </div>
    </div>
  );
}
