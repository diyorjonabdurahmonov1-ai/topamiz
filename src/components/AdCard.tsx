import Link from "next/link";
import { Sparkle } from "lucide-react";
import type { Ad } from "@/lib/types";

export default function AdCard({ ad }: { ad: Ad }) {
  return (
    <Link
      href={ad.href}
      className="card-hover relative flex min-h-[168px] flex-col overflow-hidden rounded-2xl border border-border p-5"
      style={{
        backgroundImage: `linear-gradient(135deg, ${ad.colorFrom}1a, ${ad.colorTo}1a)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blob"
        style={{ background: ad.colorFrom }}
      />
      {ad.badge && (
        <span className="mb-3 flex w-fit items-center gap-1 rounded-full border border-border bg-bg-elevated/70 px-2.5 py-1 text-[11px] font-semibold text-muted">
          <Sparkle className="h-3 w-3" />
          {ad.badge}
        </span>
      )}
      <h3 className="relative z-10 text-lg font-bold text-foreground">{ad.title}</h3>
      <p className="relative z-10 mt-1.5 flex-1 text-sm text-muted">{ad.subtitle}</p>
      <span className="relative z-10 mt-3 text-sm font-semibold text-brand-via">
        {ad.cta} →
      </span>
    </Link>
  );
}
