import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import MysteryBoxForm from "@/components/MysteryBoxForm";

export const metadata: Metadata = {
  title: "Sirli quti yaratish — Findo",
};

export default async function CreateMysteryBoxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-gold to-brand-via text-white">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {dict.mysteryBoxForm.pageTitle}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{dict.mysteryBoxForm.pageSubtitle}</p>
      </div>
      <MysteryBoxForm dict={dict} />
    </div>
  );
}
