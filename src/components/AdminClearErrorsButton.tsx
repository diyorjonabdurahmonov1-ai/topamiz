"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export default function AdminClearErrorsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function clear() {
    if (!confirm("Barcha xatolarni ro'yxatdan o'chirmoqchimisiz?")) return;
    setBusy(true);
    const res = await fetch("/api/admin/errors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) router.refresh();
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={clear}
      disabled={busy}
      className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-muted hover:text-danger disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Hammasini tozalash
    </button>
  );
}
