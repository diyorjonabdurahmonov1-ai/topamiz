import type { Metadata } from "next";
import { Check, Megaphone, TrendingUp, Users } from "lucide-react";
import AdCard from "@/components/AdCard";
import StatCard from "@/components/StatCard";
import AdInquiryForm from "@/components/AdInquiryForm";
import { ads } from "@/lib/data";

export const metadata: Metadata = {
  title: "Reklama taxtachasi — Topamiz",
};

const plans = [
  {
    name: "Boshlang'ich",
    price: "Bepul",
    features: ["1 ta oddiy e'lon", "7 kun ko'rinadi", "Asosiy statistika"],
  },
  {
    name: "Biznes",
    price: "350 000 so'm/oy",
    features: [
      "Bosh sahifada banner",
      "30 kun ko'rinadi",
      "Reklama taxtachasida ustunlik",
      "Batafsil statistika",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    price: "900 000 so'm/oy",
    features: [
      "Barcha sahifalarda ko'rinish",
      "Cheklanmagan muddat",
      "Shaxsiy menejer",
      "AI Yordamchi tavsiyalarida ustunlik",
    ],
  },
];

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

      <div className="mt-14">
        <h2 className="text-center text-xl font-bold">Tariflar</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card-hover rounded-2xl border p-6 ${
                plan.highlighted
                  ? "border-brand-via bg-brand-via/5"
                  : "border-border bg-surface"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-3 inline-block rounded-full btn-brand px-3 py-1 text-xs font-semibold text-white">
                  Tavsiya etiladi
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-1 text-2xl font-extrabold">{plan.price}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-xl">
        <AdInquiryForm />
      </div>
    </div>
  );
}
