import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import ListingsGrid from "@/components/ListingsGrid";
import StatCard from "@/components/StatCard";
import { getMysteryBoxListings } from "@/lib/listings";
import { getVisitorCountry } from "@/lib/geo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Sirli quti — Findo",
};

export default async function MysteryBoxPage() {
  const boxes = getMysteryBoxListings(await getVisitorCountry());
  const dict = getDictionary(await getLocale());

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-accent-gold/25 bg-gradient-to-br from-accent-gold/10 via-brand-via/5 to-transparent p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-gold to-brand-via text-white">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.mysteryBox.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{dict.mysteryBox.subtitle}</p>
        <div className="mx-auto mt-7 max-w-xs">
          <StatCard icon={Sparkles} value={String(boxes.length)} label={dict.mysteryBox.activeCount} />
        </div>
        <Link
          href="/elon-qoshish/sirli-quti"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent-gold to-brand-via px-5 py-2.5 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          {dict.postListing.mysteryBoxCalloutButton}
        </Link>
      </div>

      {boxes.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Sparkles className="h-8 w-8 text-muted" />
          <p className="mt-3 text-sm font-semibold">{dict.mysteryBox.emptyTitle}</p>
          <p className="mt-1 max-w-sm text-sm text-muted">{dict.mysteryBox.emptyBody}</p>
        </div>
      ) : (
        <div className="mt-8">
          <ListingsGrid listings={boxes} dict={dict} />
        </div>
      )}
    </div>
  );
}
