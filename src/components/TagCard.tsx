"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Copy, Download, ExternalLink, Loader2, RotateCcw, Trash2 } from "lucide-react";
import type { ItemTag } from "@/lib/tags";
import type { Dictionary } from "@/lib/i18n";
import { formatDate } from "@/lib/data";

export default function TagCard({
  tag,
  qrDataUrl,
  url,
  dict,
}: {
  tag: ItemTag;
  qrDataUrl: string;
  url: string;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const resolved = tag.status === "resolved";

  async function handleDelete() {
    if (!confirm(dict.tags.deleteConfirm)) return;
    setDeleting(true);
    const res = await fetch(`/api/tags/${tag.code}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setDeleting(false);
  }

  async function handleToggleStatus() {
    setUpdating(true);
    const res = await fetch(`/api/tags/${tag.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: resolved ? "active" : "resolved" }),
    });
    // The card keeps the same React key (tag.id) across a refresh, so its
    // local state survives — reset it here instead of relying on remount.
    if (res.ok) router.refresh();
    setUpdating(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context) — nothing to
      // recover from client-side, the link is still visible for manual copy.
    }
  }

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL, not an optimizable asset */}
      <img
        src={qrDataUrl}
        alt="QR"
        className={`h-24 w-24 shrink-0 rounded-lg border border-border ${resolved ? "opacity-40" : ""}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold">{tag.title}</p>
          {resolved && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
              <CheckCircle2 className="h-3 w-3" />
              {dict.tags.foundBadge}
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{tag.description}</p>
        <p className="mt-1.5 text-xs text-muted">{formatDate(tag.createdAt.slice(0, 10))}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
          <a
            href={qrDataUrl}
            download={`findo-qr-${tag.code}.png`}
            className="flex items-center gap-1 text-xs font-semibold text-brand-via hover:text-brand-to"
          >
            <Download className="h-3.5 w-3.5" />
            {dict.tags.download}
          </a>
          <Link
            href={`/t/${tag.code}`}
            target="_blank"
            className="flex items-center gap-1 text-xs font-semibold text-brand-via hover:text-brand-to"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {dict.tags.view}
          </Link>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-semibold text-brand-via hover:text-brand-to"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? dict.tags.copied : dict.tags.copyLink}
          </button>
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={updating}
            className="flex items-center gap-1 text-xs font-semibold text-accent-gold hover:text-accent-gold/80 disabled:opacity-60"
          >
            {updating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : resolved ? (
              <RotateCcw className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {resolved ? dict.tags.reactivate : dict.tags.markFound}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 text-xs font-semibold text-danger hover:text-danger/80 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            {dict.tags.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
