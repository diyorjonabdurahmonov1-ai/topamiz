import type { Metadata } from "next";
import { getReportedListings } from "@/lib/listing-reports";
import AdminReportedListingRow from "@/components/AdminReportedListingRow";

export const metadata: Metadata = {
  title: "Shikoyatlar — Topamiz",
};

export default function AdminReportsPage() {
  const reported = getReportedListings();

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
    </div>
  );
}
