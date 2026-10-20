"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ExternalLink, Loader2, ShieldOff } from "lucide-react";
import type { ReportedUserSummary } from "@/lib/user-blocks";

const CONTEXT_LABEL: Record<string, string> = { chat: "chatdan", profile: "profildan" };

export default function AdminReportedUserRow({ item }: { item: ReportedUserSummary }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"block" | "dismiss" | null>(null);

  async function run(kind: "block" | "dismiss") {
    if (kind === "block" && !confirm(`${item.name}ni saytdan bloklaysizmi?`)) return;
    setBusy(kind);
    const res =
      kind === "block"
        ? await fetch(`/api/admin/users/${item.userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blocked: true }),
          })
        : await fetch(`/api/admin/user-reports/${item.userId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    setBusy(null);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{item.name}</p>
            <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
              {item.reportCount} ta shikoyat
            </span>
            {item.blockedAt && (
              <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                Bloklangan
              </span>
            )}
          </div>
          <ul className="mt-1.5 space-y-0.5">
            {item.reasons.map((r, i) => (
              <li key={i} className="text-xs text-muted">
                <span className="font-semibold">{CONTEXT_LABEL[r.context] ?? r.context}</span>
                {" · "}
                {r.text || "(sababsiz)"}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href={`/profil/${item.userId}`}
          target="_blank"
          aria-label="Profilni ko'rish"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
        {!item.blockedAt && (
          <button
            type="button"
            onClick={() => run("block")}
            disabled={!!busy}
            aria-label="Saytdan bloklash"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-danger hover:bg-danger/10 disabled:opacity-60"
          >
            {busy === "block" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={() => run("dismiss")}
          disabled={!!busy}
          aria-label="Shikoyatlarni yopish"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-success hover:bg-success/10 disabled:opacity-60"
        >
          {busy === "dismiss" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
