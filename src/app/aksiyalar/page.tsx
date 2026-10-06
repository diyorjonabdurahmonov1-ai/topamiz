import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import PromoGrid from "@/components/PromoGrid";
import { getPromoListings } from "@/lib/listings";
import { getVisitorCountry } from "@/lib/geo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Aksiyalar — Findo",
};

export default async function PromoPage() {
  const listings = getPromoListings(await getVisitorCountry());
  const dict = getDictionary(await getLocale());

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-sky-500/25 bg-gradient-to-br from-sky-500/10 via-brand-via/5 to-transparent p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-brand-via text-white">
          <Tag className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.promo.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{dict.promo.subtitle}</p>
        <Link
          href="/elon-qoshish/aksiya"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-brand-via px-5 py-2.5 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          {dict.promo.postButton}
        </Link>
      </div>

      <div className="mt-8">
        <PromoGrid listings={listings} dict={dict} />
      </div>
    </div>
  );
}
