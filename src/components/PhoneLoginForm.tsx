"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

type Step = "phone" | "code";

export default function PhoneLoginForm({ dict }: { dict: Dictionary }) {
  const t = dict.login;
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function post(url: string, body: object) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, data };
  }

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await post("/api/auth/phone/send", { phone });
      if (typeof data?.resendIn === "number") setResendIn(data.resendIn);
      if (!ok) {
        setError(data?.error ?? t.genericError);
        return;
      }
      setSentTo(data.phone);
      setCode("");
      setStep("code");
    } catch {
      setError(t.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await post("/api/auth/phone/verify", { phone: sentTo, code });
      if (!ok) {
        setError(data?.error ?? t.genericError);
        setBusy(false);
        return;
      }
      // refresh() re-renders the server parts (navbar, bottom nav) with the
      // new session.
      router.replace("/profil");
      router.refresh();
    } catch {
      setError(t.genericError);
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40";
  const buttonClass =
    "btn-brand flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white disabled:opacity-70";

  if (step === "code") {
    return (
      <form onSubmit={verify} className="space-y-3">
        <p className="text-center text-sm text-muted">
          {t.codeSentTo} <span className="font-semibold text-foreground">{sentTo}</span>
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="000000"
          aria-label={t.codeLabel}
          className={`${inputClass} text-center text-lg font-bold tracking-[0.5em]`}
        />
        {error && <p className="text-center text-xs font-medium text-danger">{error}</p>}
        <button type="submit" disabled={busy || code.length !== 6} className={buttonClass}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {t.verify}
        </button>
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setError("");
            }}
            className="font-semibold text-muted hover:text-foreground"
          >
            {t.changeNumber}
          </button>
          {resendIn > 0 ? (
            <span className="tabular-nums text-muted">
              {t.resend} · {resendIn}s
            </span>
          ) : (
            <button
              type="button"
              onClick={() => sendCode()}
              disabled={busy}
              className="font-semibold text-brand-via"
            >
              {t.resend}
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-3">
      <div className="relative">
        <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <span className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-sm font-semibold">
          +998
        </span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="90 123 45 67"
          aria-label={t.phoneLabel}
          className={`${inputClass} pl-[5.25rem]`}
        />
      </div>
      {error && <p className="text-center text-xs font-medium text-danger">{error}</p>}
      <button type="submit" disabled={busy || phone.replace(/\D/g, "").length < 9} className={buttonClass}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {t.sendCode}
      </button>
      <p className="text-center text-xs text-muted">{t.phoneHint}</p>
    </form>
  );
}
