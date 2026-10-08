import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { SAFETY_RULES } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Xavfsizlik qoidalari — Findo",
};


export default function SafetyRulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-via/10 text-brand-via">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">Xavfsizlik qoidalari</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Yo'qolgan yoki topilgan buyumni topshirish har doim begona odam bilan uchrashuvni anglatadi.
        O'zingizni va buyumingizni himoya qilish uchun quyidagi qoidalarga amal qiling.
      </p>

      <div className="mt-8 space-y-4">
        {SAFETY_RULES.map((rule) => (
          <div key={rule.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-via/10 text-brand-via">
              <rule.icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">{rule.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{rule.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-danger/25 bg-danger/5 p-5 text-sm text-muted">
        <p className="font-bold text-danger">Firibgarlikka duch kelsangiz</p>
        <p className="mt-1.5 leading-relaxed">
          Pul yoki shaxsiy ma'lumot talab qilib firibgarlik qilishga urinilgan bo'lsa, darhol suhbatni
          to'xtating va{" "}
          <a href="mailto:info@findo.net.uz" className="font-semibold text-brand-via hover:underline">
            info@findo.net.uz
          </a>{" "}
          manziliga yozing yoki tegishli holatlarda politsiyaga murojaat qiling.
        </p>
      </div>
    </div>
  );
}
