"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe, Loader2, Server, Smartphone, Video } from "lucide-react";
import type { ErrorGroup } from "@/lib/error-log";
import { describeUserAgent } from "@/lib/user-agent";
import { formatTimeAgo } from "@/lib/i18n/format";

const KINDS = {
  client: { label: "Brauzer", icon: Smartphone, tone: "bg-sky-500/15 text-sky-600 dark:text-sky-300" },
  server: { label: "Server", icon: Server, tone: "bg-danger/15 text-danger" },
  "video-upload": { label: "Video yuklash", icon: Video, tone: "bg-accent-gold/15 text-accent-gold" },
} as const;

export default function AdminErrorRow({ group }: { group: ErrorGroup }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const kind = KINDS[group.kind] ?? KINDS.client;
  const Icon = kind.icon;

  async function markFixed() {
    setBusy(true);
    const res = await fetch("/api/admin/errors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: group.fingerprint }),
    });
    if (res.ok) router.refresh();
    else setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 p-3.5 text-left">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${kind.tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 break-words text-sm font-bold">{group.message}</span>
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
            <span className="font-semibold text-foreground">{group.count} marta</span>
            <span>{group.users} kishi</span>
            <span suppressHydrationWarning>oxirgisi {formatTimeAgo("uz", group.lastSeen)}</span>
            <span className="truncate">{describeUserAgent(group.userAgent)}</span>
          </span>
        </span>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border p-3.5 text-xs">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <dt className="text-muted">Turi</dt>
            <dd className="font-semibold">{kind.label}</dd>
            <dt className="text-muted">Sahifalar</dt>
            <dd className="flex flex-wrap gap-1">
              {(group.paths.length ? group.paths : ["—"]).map((p) => (
                <span key={p} className="flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 font-mono">
                  <Globe className="h-3 w-3" />
                  {p}
                </span>
              ))}
            </dd>
            <dt className="text-muted">Birinchi marta</dt>
            <dd suppressHydrationWarning>{formatTimeAgo("uz", group.firstSeen)}</dd>
            <dt className="text-muted">Qurilma</dt>
            <dd className="break-all">{group.userAgent || "—"}</dd>
          </dl>
          {group.detail && (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-surface-2 p-2.5 font-mono text-[11px] leading-relaxed text-muted">
              {group.detail}
            </pre>
          )}
          <button
            type="button"
            onClick={markFixed}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 py-2 font-semibold text-success disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Tuzatildi — ro&apos;yxatdan olib tashlash
          </button>
        </div>
      )}
    </div>
  );
}
