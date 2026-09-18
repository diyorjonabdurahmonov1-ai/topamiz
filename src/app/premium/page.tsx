import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, QrCode, Sparkles, Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { FREE_TAG_LIMIT } from "@/lib/tags";
import PremiumActivateButton from "@/components/PremiumActivateButton";

export const metadata: Metadata = {
  title: "Premium — Topamiz",
};

const perks = [
  {
    icon: QrCode,
    title: "Cheksiz QR-belgilar",
    desc: `Bepul rejada ${FREE_TAG_LIMIT} tagacha, Premium'da buyumlaringizga cheklovsiz QR-belgi yarating.`,
  },
  {
    icon: Star,
    title: "Premium nishon",
    desc: "Profilingizda va xabarlaringizda \"⭐ Premium a'zo\" nishoni ko'rinadi.",
  },
];

export default async function PremiumPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl btn-brand text-white">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Topamiz Premium</h1>
        <p className="mt-1.5 text-sm text-muted">
          Bir necha qo'shimcha imkoniyat bilan buyumlaringizni yanada yaxshiroq himoya qiling.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {perks.map((perk) => (
          <div key={perk.title} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand-via">
              <perk.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">{perk.title}</p>
              <p className="mt-0.5 text-sm text-muted">{perk.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {user.isPremium ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-accent-gold/30 bg-accent-gold/5 px-5 py-3.5 text-sm font-semibold text-accent-gold">
            <CheckCircle2 className="h-4 w-4" />
            Siz Premium a'zosiz
          </div>
        ) : (
          <>
            <PremiumActivateButton />
            <p className="mt-2 text-center text-xs text-muted">
              Demo rejim — real to'lov olinmaydi. Faollashtirish darhol ishga tushadi.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
