import type { Metadata } from "next";
import { Megaphone, TrendingUp, Users } from "lucide-react";
import AdCarousel from "@/components/AdCarousel";
import StatCard from "@/components/StatCard";
import AdInquiryForm from "@/components/AdInquiryForm";
import { getActiveAds } from "@/lib/ads";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Reklama taxtachasi — Topamiz",
};

export default async function AdBoardPage() {
  const ads = getActiveAds();
  const dict = getDictionary(await getLocale());

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl btn-brand text-white">
          <Megaphone className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.ads.pageTitle}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{dict.ads.pageSubtitle}</p>
      </div>

      <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard icon={Users} value="18 500+" label={dict.ads.monthlyUsers} />
        <StatCard icon={TrendingUp} value="42 000+" label={dict.ads.monthlyViews} />
      </div>

      {ads.length > 0 && (
        <div className="mx-auto mt-12 max-w-lg">
          <h2 className="mb-3 text-center text-xl font-bold">{dict.ads.currentBannerHeading}</h2>
          <AdCarousel ads={ads} dict={dict} />
        </div>
      )}

      <div className="mx-auto mt-14 max-w-xl">
        <AdInquiryForm dict={dict} />
      </div>
    </div>
  );
}
