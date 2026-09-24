"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Phone, Undo2 } from "lucide-react";
import type { AdInquiry } from "@/lib/ad-inquiries";
import { formatDate } from "@/lib/data";

export default function AdminAdInquiryRow({ item }: { item: AdInquiry }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const handled = !!item.handledAt;

  async function toggleHandled() {
    setSaving(true);
    const res = await fetch(`/api/admin/ad-inquiries/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handled: !handled }),
    });
    if (res.ok) router.refresh();
    else setSaving(false);
  }

  return (
    <div className={`rounded-2xl border p-3.5 ${handled ? "border-border bg-surface opacity-60" : "border-border bg-surface"}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{item.company}</p>
            {handled && (
              <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                Ko&apos;rib chiqilgan
              </span>
            )}
          </div>
          <a
            href={`tel:${item.phone}`}
            className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-via hover:underline"
          >
            <Phone className="h-3 w-3" />
            {item.phone}
          </a>
          {item.message && <p className="mt-1.5 text-sm text-muted">{item.message}</p>}
          <p className="mt-1.5 text-xs text-muted">{formatDate(item.createdAt.slice(0, 10))}</p>
        </div>
        <button
          type="button"
          onClick={toggleHandled}
          disabled={saving}
          aria-label={handled ? "Ko'rib chiqilmagan deb belgilash" : "Ko'rib chiqilgan deb belgilash"}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border disabled:opacity-60 ${
            handled
              ? "border-border text-muted hover:text-foreground"
              : "border-success/40 text-success hover:bg-success/10"
          }`}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : handled ? (
            <Undo2 className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
