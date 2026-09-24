import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
    </div>
  );
}
