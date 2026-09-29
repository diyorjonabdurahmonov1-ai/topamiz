"use client";

import { useState } from "react";
import { formatDate } from "@/lib/data";
import type { GuestVisitRow } from "@/lib/guest-visits";

const PAGE_SIZE = 10;

export default function AdminGuestsTable({ guests }: { guests: GuestVisitRow[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = guests.slice(0, visibleCount);
  const hasMore = visibleCount < guests.length;

  return (
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
            visible.map((guest) => (
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

      {hasMore && (
        <div className="flex justify-center border-t border-border bg-surface p-3">
          <button
            type="button"
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="rounded-xl border border-border bg-bg-elevated px-6 py-2 text-sm font-semibold hover:bg-surface-2"
          >
            Yana ko'rsatish
          </button>
        </div>
      )}
    </div>
  );
}
