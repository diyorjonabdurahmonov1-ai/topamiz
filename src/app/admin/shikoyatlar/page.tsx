import type { Metadata } from "next";
import { getReportedListings } from "@/lib/listing-reports";
import AdminReportedListingRow from "@/components/AdminReportedListingRow";
import AdminReportedUserRow from "@/components/AdminReportedUserRow";
import { getReportedUsers } from "@/lib/user-blocks";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Shikoyatlar — Findo",
};

export default async function AdminReportsPage() {
  await requireAdmin();
  const reported = getReportedListings();
  const reportedUsers = getReportedUsers();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Shikoyatlar</h1>
      <p className="mt-1.5 text-sm text-muted">
        Foydalanuvchilar shikoyat qilgan e&apos;lonlar. 3 kishi shikoyat qilsa,
        e&apos;lon avtomatik o&apos;chiriladi — bu yerda undan oldinroq ham
        qo&apos;lda o&apos;chirishingiz mumkin.
      </p>

      <div className="mt-6 space-y-3">
        {reported.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            Hozircha shikoyat qilingan e&apos;lon yo&apos;q.
          </p>
        ) : (
          reported.map((item) => <AdminReportedListingRow key={item.listingId} item={item} />)
        )}
      </div>

      <h2 className="mt-10 text-lg font-extrabold tracking-tight">Foydalanuvchilar ustidan shikoyatlar</h2>
      <p className="mt-1.5 text-sm text-muted">
        Profil yoki chatdan yuborilgan. App Store va Google Play shikoyatlar 24 soat ichida ko&apos;rib
        chiqilishini talab qiladi: bloklang yoki ✓ bilan yoping.
      </p>
      <div className="mt-4 space-y-3">
        {reportedUsers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            Hozircha foydalanuvchi ustidan shikoyat yo&apos;q.
          </p>
        ) : (
          reportedUsers.map((item) => <AdminReportedUserRow key={item.userId} item={item} />)
        )}
      </div>
    </div>
  );
}
