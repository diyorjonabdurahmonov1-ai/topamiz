"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import type { ReportedListingSummary } from "@/lib/listing-reports";

export default function AdminReportedListingRow({ item }: { item: ReportedListingSummary }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${item.title}" e'lonini o'chirmoqchimisiz?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/listings/${item.listingId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setDeleting(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
              {item.reportCount} ta shikoyat
            </span>
          </div>
          {item.reasons.length > 0 && (
            <p className="mt-1 truncate text-xs text-muted">{item.reasons.join(" · ")}</p>
          )}
        </div>
        <Link
          href={`/elonlar/${item.listingId}`}
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
    </div>
  );
}
