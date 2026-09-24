import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAllAds } from "@/lib/ads";
import AdminAdForm from "@/components/AdminAdForm";
import AdminAdRow from "@/components/AdminAdRow";

export const metadata: Metadata = {
  title: "Reklama boshqaruvi — Topamiz",
};

export default async function AdminAdsPage() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) redirect("/");

  const ads = getAllAds();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Reklama banneri</h1>
      <p className="mt-1.5 text-sm text-muted">
        Rasm, video yoki GIF yuklang, havola qo&apos;shing — bosh sahifadagi
        bannerda ketma-ket aylanadi.
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
          ads.map((ad) => <AdminAdRow key={ad.id} ad={ad} />)
        )}
      </div>
    </div>
  );
}
