"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Trash2 } from "lucide-react";
import type { ItemTag } from "@/lib/tags";
import { formatDate } from "@/lib/data";

export default function TagCard({ tag, qrDataUrl }: { tag: ItemTag; qrDataUrl: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Bu QR-belgini o'chirmoqchimisiz?")) return;
    setDeleting(true);
    const res = await fetch(`/api/tags/${tag.code}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setDeleting(false);
  }

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL, not an optimizable asset */}
      <img src={qrDataUrl} alt="QR kod" className="h-24 w-24 shrink-0 rounded-lg border border-border" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{tag.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{tag.description}</p>
        <p className="mt-1.5 text-xs text-muted">{formatDate(tag.createdAt.slice(0, 10))}</p>
        <div className="mt-2 flex gap-3">
          <a
            href={qrDataUrl}
            download={`topamiz-qr-${tag.code}.png`}
            className="flex items-center gap-1 text-xs font-semibold text-brand-via hover:text-brand-to"
          >
            <Download className="h-3.5 w-3.5" />
            Yuklab olish
          </a>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 text-xs font-semibold text-danger hover:text-danger/80 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}
