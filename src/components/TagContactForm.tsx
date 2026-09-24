"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export default function TagContactForm({
  code,
  isLoggedIn,
  dict,
}: {
  code: string;
  isLoggedIn: boolean;
  dict: Dictionary;
}) {
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError(dict.tags.messageRequiredError);
      return;
    }
    setError("");
    setStatus("sending");
    try {
      const res = await fetch(`/api/tags/${code}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, guestName, guestPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? dict.tags.genericError);
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.tags.genericError);
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-bold">{dict.tags.sentTitle}</p>
        <p className="mt-1 text-sm text-muted">{dict.tags.sentBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm font-bold">{dict.tags.writeToOwner}</p>
      <div className="mt-3 space-y-3">
        {!isLoggedIn && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={dict.tags.guestNamePlaceholder}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder={dict.tags.guestPhonePlaceholder}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
          </div>
        )}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder={dict.tags.contactMessagePlaceholder}
          className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
        />
      </div>

      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-brand mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
      >
        {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {dict.tags.send}
      </button>
      {!isLoggedIn && <p className="mt-2 text-center text-xs text-muted">{dict.tags.loginHint}</p>}
    </form>
  );
}
