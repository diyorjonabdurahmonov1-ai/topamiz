import Link from "next/link";
import { Wand2 } from "lucide-react";
import type { MatchResult } from "@/lib/ai";
import type { Dictionary } from "@/lib/i18n";
import { categoryIcons } from "@/lib/icons";

export default function AiMatches({ matches, dict }: { matches: MatchResult[]; dict: Dictionary }) {
  if (matches.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg btn-brand text-white">
          <Wand2 className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold">{dict.aiMatches.title}</h3>
      </div>
      <div className="mt-4 space-y-3">
        {matches.map(({ listing, score, reasons }) => {
          const Icon = categoryIcons[listing.category];
          const categoryLabel = dict.categories[listing.category];
          return (
            <Link
              key={listing.id}
              href={`/elonlar/${listing.id}`}
              className="card-hover flex items-center gap-3 rounded-xl border border-border bg-bg-elevated p-3"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${listing.colorFrom}, ${listing.colorTo})`,
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{listing.title}</p>
                <p className="truncate text-xs text-muted">
                  {categoryLabel} · {listing.city} ·{" "}
                  {reasons.map((r) => dict.aiMatches.reasons[r]).join(", ")}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                {Math.round(score * 100)}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
