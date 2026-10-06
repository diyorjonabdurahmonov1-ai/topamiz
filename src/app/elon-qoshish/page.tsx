import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles, Tag } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import PostListingForm from "@/components/PostListingForm";

export const metadata: Metadata = {
  title: "E'lon joylash — Findo",
};

export default async function PostListingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {dict.postListing.pageTitlePrefix}{" "}
          <span className="gradient-text">{dict.postListing.pageTitleHighlight}</span>{" "}
          {dict.postListing.pageTitleSuffix}
        </h1>
        <p className="mt-2 text-sm text-muted">{dict.postListing.pageSubtitle}</p>
      </div>
      <PostListingForm dict={dict} locale={locale} />

      <Link
        href="/elon-qoshish/sirli-quti"
        className="card-hover mt-6 flex items-center gap-3 rounded-2xl border border-accent-gold/30 bg-gradient-to-r from-accent-gold/10 via-brand-via/5 to-transparent p-5"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-gold to-brand-via text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{dict.postListing.mysteryBoxCalloutTitle}</p>
          <p className="mt-0.5 text-xs text-muted">{dict.postListing.mysteryBoxCalloutBody}</p>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-accent-gold">
          {dict.postListing.mysteryBoxCalloutButton}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>

      <Link
        href="/elon-qoshish/aksiya"
        className="card-hover mt-3 flex items-center gap-3 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-brand-via/5 to-transparent p-5"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-brand-via text-white">
          <Tag className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{dict.postListing.promoCalloutTitle}</p>
          <p className="mt-0.5 text-xs text-muted">{dict.postListing.promoCalloutBody}</p>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-sky-500">
          {dict.postListing.promoCalloutButton}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </div>
  );
}
