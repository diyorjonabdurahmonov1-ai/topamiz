import type { Metadata } from "next";
import { Megaphone, TrendingUp, Users } from "lucide-react";
import AdCard from "@/components/AdCard";
import StatCard from "@/components/StatCard";
import AdInquiryForm from "@/components/AdInquiryForm";
import { ads } from "@/lib/data";

export const metadata: Metadata = {
  title: "Reklama taxtachasi — Topamiz",
};

export default function AdBoardPage() {
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

      <div className="mt-12">
        <h2 className="text-xl font-bold">Hozirgi reklamalar</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-xl">
        <AdInquiryForm />
      </div>
    </div>
  );
}
