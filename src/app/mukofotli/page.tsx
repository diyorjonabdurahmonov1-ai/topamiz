import type { Metadata } from "next";
import { Gift, ShieldCheck, TrendingUp } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import StatCard from "@/components/StatCard";
import { formatSom, getRewardedListings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Mukofotli e'lonlar — Topamiz",
};

export default function RewardedPage() {
  const rewarded = getRewardedListings();
  const totalReward = rewarded.reduce((sum, l) => sum + (l.reward ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-accent-gold/25 bg-accent-gold/5 p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-gold/15 text-accent-gold">
          <Gift className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Mukofotli e'lonlar
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          Bu buyumlarning egalari topib berganlarga mukofot taklif qilishadi.
          Buyumni topib, egasiga qaytarib bering va mukofotingizni oling.
        </p>
        <div className="mx-auto mt-7 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard icon={Gift} value={`${rewarded.length} ta`} label="Faol mukofotli e'lon" />
          <StatCard icon={TrendingUp} value={formatSom(totalReward)} label="Umumiy mukofot summasi" />
        </div>
      </div>

      <div className="mt-10 flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-via" />
        Mukofotni faqat buyum egasi bilan bevosita, ochiq va xavfsiz joyda
        uchrashib oling.
      </div>

      {rewarded.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Gift className="h-8 w-8 text-muted" />
          <p className="mt-3 text-sm font-semibold">Hozircha mukofotli e'lon yo'q</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Yo'qolgan buyumingizga mukofot taklif qilsangiz, u shu yerda ko'rinadi.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rewarded.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
