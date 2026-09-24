import type { Metadata } from "next";
import { getAdInquiries } from "@/lib/ad-inquiries";
import AdminAdInquiryRow from "@/components/AdminAdInquiryRow";

export const metadata: Metadata = {
  title: "Reklama arizalari — Findo",
};

export default function AdminAdInquiriesPage() {
  const inquiries = getAdInquiries();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Reklama arizalari</h1>
      <p className="mt-1.5 text-sm text-muted">
        &quot;Reklama uchun murojaat qiling&quot; formasi orqali kelgan arizalar.
      </p>

      <div className="mt-6 space-y-3">
        {inquiries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            Hozircha ariza yo&apos;q.
          </p>
        ) : (
          inquiries.map((item) => <AdminAdInquiryRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
