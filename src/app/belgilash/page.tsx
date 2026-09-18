import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { countActiveTags, FREE_TAG_LIMIT } from "@/lib/tags";
import TagForm from "@/components/TagForm";

export const metadata: Metadata = {
  title: "QR-belgi yaratish — Topamiz",
};

export default async function CreateTagPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");

  const activeCount = countActiveTags(user.id);
  const limitReached = !user.isPremium && activeCount >= FREE_TAG_LIMIT;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Buyumingizga <span className="gradient-text">QR-belgi</span> oling
        </h1>
        <p className="mt-2 text-sm text-muted">
          Buyumingizni yo'qotishdan oldin unga QR-belgi yarating, chop eting va
          yopishtirib qo'ying. Kimdir topib olib skaner qilsa, sizga to'g'ridan-to'g'ri
          xabar yoza oladi.
        </p>
      </div>

      {limitReached ? (
        <div className="rounded-2xl border border-accent-gold/30 bg-accent-gold/5 p-6 text-center">
          <p className="text-sm font-semibold text-accent-gold">
            Bepul rejada faqat {FREE_TAG_LIMIT} ta faol QR-belgi yaratish mumkin.
          </p>
          <p className="mt-1.5 text-sm text-muted">
            Cheksiz QR-belgi yaratish uchun Premium'ga o'ting.
          </p>
          <a
            href="/premium"
            className="btn-brand mt-4 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            Premium haqida
          </a>
        </div>
      ) : (
        <TagForm />
      )}
    </div>
  );
}
