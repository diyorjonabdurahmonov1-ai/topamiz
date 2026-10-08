import type { Metadata } from "next";
import { getAllGuestVisits } from "@/lib/guest-visits";
import AdminGuestsTable from "@/components/AdminGuestsTable";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Mehmonlar — Findo",
};

export default async function AdminGuestsPage() {
  await requireAdmin();
  const guests = getAllGuestVisits();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Ro'yxatdan o'tmagan mehmonlar</h1>
      <p className="mt-1.5 text-sm text-muted">
        Jami {guests.length} ta noyob mehmon — ro'yxatdan o'tmasdan saytga kirganlar. Har biri faqat anonim
        belgi bilan aniqlanadi, shaxsiy ma'lumot saqlanmaydi.
      </p>

      <AdminGuestsTable guests={guests} />
    </div>
  );
}
