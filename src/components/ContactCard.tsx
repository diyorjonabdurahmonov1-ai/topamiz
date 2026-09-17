"use client";

import { useState } from "react";
import { Phone, ShieldCheck, User } from "lucide-react";

export default function ContactCard({
  name,
  phone,
}: {
  name: string;
  phone: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-brand-via">
          <User className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">{name}</p>
          <p className="flex items-center gap-1 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" />
            Tasdiqlangan foydalanuvchi
          </p>
        </div>
      </div>

      {revealed ? (
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className="btn-brand mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
        >
          <Phone className="h-4 w-4" />
          {phone}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="btn-brand mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
        >
          <Phone className="h-4 w-4" />
          Aloqa raqamini ko'rsatish
        </button>
      )}
      <p className="mt-3 text-center text-xs text-muted">
        Xavfsizlik uchun uchrashuvni ochiq joyda tashkillashtiring.
      </p>
    </div>
  );
}
