"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Flag, Loader2, MoreHorizontal, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

// "⋯" on a profile and in a chat: report the user to the moderators, or
// block them (lib/user-blocks). App stores require both wherever people
// can see or contact each other.
export default function UserSafetyMenu({
  userId,
  userName,
  blocked,
  context,
  dict,
  // Positions the button; must make it a positioned box (relative/absolute),
  // which the dropdown hangs from.
  className = "relative",
}: {
  userId: number;
  userName: string;
  blocked: boolean;
  context: "profile" | "chat";
  dict: Dictionary;
  className?: string;
}) {
  const t = dict.safety;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<"report" | "block" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function openSheet(next: "report" | "block") {
    setOpen(false);
    setError("");
    setSent(false);
    setSheet(next);
  }

  async function call(input: string, init: RequestInit): Promise<boolean> {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(input, init);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? t.genericError);
        return false;
      }
      return true;
    } catch {
      setError(t.genericError);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function sendReport() {
    const ok = await call(`/api/users/${userId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim(), context }),
    });
    if (ok) {
      setSent(true);
      setReason("");
    }
  }

  async function toggleBlock() {
    const ok = await call(`/api/users/${userId}/block`, { method: blocked ? "DELETE" : "POST" });
    if (ok) {
      setSheet(null);
      router.refresh();
    }
  }

  return (
    <div ref={menuRef} className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.menuLabel}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
          <button
            type="button"
            onClick={() => openSheet("report")}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold hover:bg-surface-2"
          >
            <Flag className="h-4 w-4 text-muted" />
            {t.report}
          </button>
          <button
            type="button"
            onClick={() => (blocked ? toggleBlock() : openSheet("block"))}
            disabled={busy}
            className="flex w-full items-center gap-2.5 border-t border-border px-4 py-3 text-left text-sm font-semibold text-danger hover:bg-danger/5"
          >
            {busy && blocked ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            {blocked ? t.unblock : t.block}
          </button>
        </div>
      )}

      {sheet && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => !busy && setSheet(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-up w-full max-w-md rounded-t-3xl border border-border bg-surface p-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:rounded-3xl sm:pb-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-extrabold">
                {(sheet === "report" ? t.reportTitle : t.blockTitle).replace("{name}", userName)}
              </h2>
              <button
                type="button"
                onClick={() => setSheet(null)}
                aria-label={t.cancel}
                className="-mr-1 -mt-1 rounded-lg p-1 text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {sheet === "report" ? (
              sent ? (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm font-medium text-success">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  {t.reportSent}
                </p>
              ) : (
                <>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder={t.reportPlaceholder}
                    className="mt-4 w-full rounded-xl border border-field-border bg-field px-4 py-3 text-sm placeholder:text-muted focus:border-brand-via focus:outline-none focus:ring-2 focus:ring-brand-via/30"
                  />
                  {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
                  <button
                    type="button"
                    onClick={sendReport}
                    disabled={busy}
                    className="btn-brand mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-70"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                    {t.reportSend}
                  </button>
                </>
              )
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed text-muted">{t.blockBody}</p>
                {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSheet(null)}
                    className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-surface-2"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={toggleBlock}
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-bold text-white disabled:opacity-70"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                    {t.blockConfirm}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
