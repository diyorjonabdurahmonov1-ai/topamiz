import Link from "next/link";
import { Eye, MapPin, Calendar1, Gift } from "lucide-react";
import type { Listing } from "@/lib/types";
import { categoryIcons } from "@/lib/icons";
import { categories, formatDate, formatSom } from "@/lib/data";

export default function ListingCard({ listing }: { listing: Listing }) {
  const Icon = categoryIcons[listing.category];
  const categoryLabel = categories.find((c) => c.id === listing.category)?.label ?? "";

  return (
    <Link
      href={`/elonlar/${listing.id}`}
      className="card-hover group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-4"
    >
      {listing.status === "resolved" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg/70 backdrop-blur-[2px]">
          <span className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-muted">
            Hal qilindi ✓
          </span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            listing.kind === "lost"
              ? "bg-danger/10 text-danger"
              : "bg-success/10 text-success"
          }`}
        >
          {listing.kind === "lost" ? "Yo'qoldi" : "Topildi"}
        </span>
        {listing.reward ? (
          <span className="flex items-center gap-1 rounded-full bg-accent-gold/15 px-2.5 py-1 text-xs font-semibold text-accent-gold">
            <Gift className="h-3 w-3" />
            {formatSom(listing.reward)}
          </span>
        ) : null}
      </div>

      <div
        className="mt-4 flex h-32 items-center justify-center rounded-xl"
        style={{
          backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}22, ${listing.colorTo}22)`,
        }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{
            backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}, ${listing.colorTo})`,
          }}
        >
          <Icon className="h-7 w-7" strokeWidth={2} />
        </div>
      </div>

      <div className="mt-4 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {categoryLabel}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-semibold text-foreground">
          {listing.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted">{listing.description}</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {listing.city}
        </span>
        <span className="flex items-center gap-1">
          <Calendar1 className="h-3.5 w-3.5" />
          {formatDate(listing.date)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {listing.views}
        </span>
      </div>
    </Link>
  );
}
