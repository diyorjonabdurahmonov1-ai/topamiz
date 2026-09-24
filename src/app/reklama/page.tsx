import type { Metadata } from "next";
import { Megaphone, TrendingUp, Users } from "lucide-react";
import AdCarousel from "@/components/AdCarousel";
import StatCard from "@/components/StatCard";
import AdInquiryForm from "@/components/AdInquiryForm";
import { getActiveAds } from "@/lib/ads";

export const metadata: Metadata = {
  title: "Reklama taxtachasi — Topamiz",
};

export default function AdBoardPage() {
  const ads = getActiveAds();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl btn-brand text-white">
          <Megaphone className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Reklama taxtachasi
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          Biznesingizni yo'qolgan buyum qidirayotgan minglab faol
          foydalanuvchiga ko'rsating.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard icon={Users} value="18 500+" label="Oylik faol foydalanuvchi" />
        <StatCard icon={TrendingUp} value="42 000+" label="Oylik sahifa ko'rishi" />
      </div>

      {ads.length > 0 && (
        <div className="mx-auto mt-12 max-w-lg">
          <h2 className="mb-3 text-center text-xl font-bold">Hozirgi reklama banneri</h2>
          <AdCarousel ads={ads} />
        </div>
      )}

      <div className="mx-auto mt-14 max-w-xl">
        <AdInquiryForm />
      </div>
    </div>
  );
}
