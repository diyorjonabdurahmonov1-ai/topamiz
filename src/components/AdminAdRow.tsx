"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import type { AdBanner } from "@/lib/ads";

export default function AdminAdRow({ ad }: { ad: AdBanner }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleToggle() {
    setBusy(true);
    const res = await fetch(`/api/admin/ads/${ad.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !ad.active }),
    });
    if (res.ok) router.refresh();
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm("Bu reklamani o'chirmoqchimisiz?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setBusy(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2">
        {ad.mediaType === "video" ? (
          <video src={ad.mediaUrl} className="h-full w-full object-cover" muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview thumbnail of arbitrary uploaded media
          <img src={ad.mediaUrl} alt={ad.title || "Reklama"} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{ad.title || "Nomsiz"}</p>
        <p className="truncate text-xs text-muted">{ad.linkUrl}</p>
        <p className="text-xs text-muted">{ad.active ? "Faol" : "O'chirilgan"}</p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        aria-label={ad.active ? "Yashirish" : "Faollashtirish"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : ad.active ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        aria-label="O'chirish"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-danger hover:bg-danger/10 disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
