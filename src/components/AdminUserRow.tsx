"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, ShieldOff, ShieldCheck } from "lucide-react";
import type { AdminUserRow as AdminUserRowType } from "@/lib/admin-users";
import Avatar from "./Avatar";

function relativeLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "Hech qachon kirmagan";
  const then = new Date(lastSeenAt.replace(" ", "T") + "Z").getTime();
  const diffMinutes = Math.round((Date.now() - then) / 60000);
  if (diffMinutes < 1) return "hozirgina";
  if (diffMinutes < 60) return `${diffMinutes} daqiqa oldin`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} soat oldin`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} kun oldin`;
}

export default function AdminUserRow({ user }: { user: AdminUserRowType }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const blocked = !!user.blockedAt;

  async function handleToggleBlock() {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked: !blocked }),
    });
    if (res.ok) router.refresh();
    setBusy(false);
  }

  async function handleSend() {
    if (!message.trim()) return;
    setSendStatus("sending");
    const res = await fetch(`/api/admin/users/${user.id}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim() }),
    });
    if (res.ok) {
      setMessage("");
      setSendStatus("sent");
      setTimeout(() => {
        setComposing(false);
        setSendStatus("idle");
      }, 1200);
    } else {
      setSendStatus("error");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            {user.online && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Onlayn
              </span>
            )}
            {blocked && (
              <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
                Bloklangan
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted">{user.email}</p>
          {!user.online && <p className="text-xs text-muted">{relativeLastSeen(user.lastSeenAt)}</p>}
        </div>
        <button
          type="button"
          onClick={() => setComposing((v) => !v)}
          aria-label="Xabar yuborish"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground"
        >
          <Send className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleToggleBlock}
          disabled={busy}
          aria-label={blocked ? "Blokdan chiqarish" : "Bloklash"}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border disabled:opacity-60 ${
            blocked
              ? "border-border text-success hover:bg-success/10"
              : "border-border text-danger hover:bg-danger/10"
          }`}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : blocked ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <ShieldOff className="h-4 w-4" />
          )}
        </button>
      </div>

      {composing && (
        <div className="mt-3 border-t border-border pt-3">
          {sendStatus === "sent" ? (
            <p className="text-xs font-medium text-success">Xabar yuborildi!</p>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`${user.name}ga xabar...`}
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sendStatus === "sending" || !message.trim()}
                className="btn-brand flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
              >
                {sendStatus === "sending" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Yuborish
              </button>
            </div>
          )}
          {sendStatus === "error" && (
            <p className="mt-1.5 text-xs font-medium text-danger">Xatolik yuz berdi, qayta urinib ko'ring.</p>
          )}
        </div>
      )}
    </div>
  );
}
