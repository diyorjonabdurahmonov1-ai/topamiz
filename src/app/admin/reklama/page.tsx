import type { Metadata } from "next";
import { getAllAds } from "@/lib/ads";
import AdminAdForm from "@/components/AdminAdForm";
import AdminAdRow from "@/components/AdminAdRow";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Reklama boshqaruvi — Findo",
};

export default async function AdminAdsPage() {
  await requireAdmin();
  const ads = getAllAds();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Reklama banneri</h1>
      <p className="mt-1.5 text-sm text-muted">
        Rasm, video yoki GIF yuklang — bosh sahifadagi bannerda ketma-ket
        aylanadi. Havola ixtiyoriy. Har bir reklama necha marta ko&apos;rilgani va
        bosilgani pastda ko&apos;rinadi.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <AdminAdForm />
      </div>

      <div className="mt-8 space-y-3">
        {ads.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            Hali reklama qo&apos;shilmagan.
          </p>
        ) : (
          ads.map((ad, i) => <AdminAdRow key={ad.id} ad={ad} first={i === 0} last={i === ads.length - 1} />)
        )}
      </div>
    </div>
  );
}
