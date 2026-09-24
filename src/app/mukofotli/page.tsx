import type { Metadata } from "next";
import { Gift, ShieldCheck, TrendingUp } from "lucide-react";
import ListingRow from "@/components/ListingRow";
import StatCard from "@/components/StatCard";
import { formatSom } from "@/lib/data";
import { getRewardedListings } from "@/lib/listings";
import { getVisitorCountry } from "@/lib/geo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Mukofotli e'lonlar — Findo",
};

export default async function RewardedPage() {
  const rewarded = getRewardedListings(await getVisitorCountry());
  const totalReward = rewarded.reduce((sum, l) => sum + (l.reward ?? 0), 0);
  const dict = getDictionary(await getLocale());

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-accent-gold/25 bg-accent-gold/5 p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-gold/15 text-accent-gold">
          <Gift className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.rewarded.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{dict.rewarded.subtitle}</p>
        <div className="mx-auto mt-7 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard icon={Gift} value={String(rewarded.length)} label={dict.rewarded.activeCount} />
          <StatCard icon={TrendingUp} value={formatSom(totalReward)} label={dict.rewarded.totalReward} />
        </div>
      </div>

      <div className="mt-10 flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-via" />
        {dict.rewarded.safetyNote}
      </div>

      {rewarded.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Gift className="h-8 w-8 text-muted" />
          <p className="mt-3 text-sm font-semibold">{dict.rewarded.emptyTitle}</p>
          <p className="mt-1 max-w-sm text-sm text-muted">{dict.rewarded.emptyBody}</p>
        </div>
      ) : (
        <div className="mt-8">
          <ListingRow listings={rewarded} dict={dict} />
        </div>
      )}
    </div>
  );
}
