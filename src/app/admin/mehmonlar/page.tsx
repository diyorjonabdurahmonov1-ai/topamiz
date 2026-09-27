import type { Metadata } from "next";
import { getAllGuestVisits } from "@/lib/guest-visits";
import { formatDate } from "@/lib/data";

export const metadata: Metadata = {
  title: "Mehmonlar — Findo",
};

export default function AdminGuestsPage() {
  const guests = getAllGuestVisits();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Ro'yxatdan o'tmagan mehmonlar</h1>
      <p className="mt-1.5 text-sm text-muted">
        Jami {guests.length} ta noyob mehmon — ro'yxatdan o'tmasdan saytga kirganlar. Har biri faqat anonim
        belgi bilan aniqlanadi, shaxsiy ma'lumot saqlanmaydi.
      </p>

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5">Belgi</th>
              <th className="px-4 py-2.5">Birinchi tashrif</th>
              <th className="px-4 py-2.5">Oxirgi tashrif</th>
              <th className="px-4 py-2.5">Tashriflar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {guests.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Hozircha mehmon yo'q.
                </td>
              </tr>
            ) : (
              guests.map((guest) => (
                <tr key={guest.guestId}>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{guest.guestId.slice(0, 8)}</td>
                  <td className="px-4 py-2.5">{formatDate(guest.firstSeenAt.slice(0, 10))}</td>
                  <td className="px-4 py-2.5">{formatDate(guest.lastSeenAt.slice(0, 10))}</td>
                  <td className="px-4 py-2.5">{guest.visitCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
