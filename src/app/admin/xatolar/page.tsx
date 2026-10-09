import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getErrorGroups } from "@/lib/error-log";
import AdminErrorRow from "@/components/AdminErrorRow";
import AdminClearErrorsButton from "@/components/AdminClearErrorsButton";

export const metadata: Metadata = {
  title: "Xatolar — Findo",
};

export default async function AdminErrorsPage() {
  await requireAdmin();
  const groups = getErrorGroups();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Xatolar</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            Foydalanuvchilar telefoni yoki kompyuterida, shuningdek serverda chiqqan xatolar. Bir xil xatolar bitta
            qatorga yig&apos;iladi. Batafsil ma&apos;lumot uchun ustiga bosing. 30 kundan eskilari o&apos;zi o&apos;chadi.
          </p>
        </div>
        {groups.length > 0 && <AdminClearErrorsButton />}
      </div>

      <div className="mt-5 space-y-2.5">
        {groups.length === 0 ? (
          <p className="flex items-center justify-center gap-2 rounded-2xl border border-success/30 bg-success/10 py-10 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            Hozircha xato yo&apos;q
          </p>
        ) : (
          groups.map((g) => <AdminErrorRow key={g.fingerprint} group={g} />)
        )}
      </div>
    </div>
  );
}
