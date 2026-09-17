"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

const plans = ["Boshlang'ich", "Biznes", "Premium"] as const;

export default function AdInquiryForm() {
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState<typeof plans[number]>("Biznes");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!company.trim() || !phone.trim()) {
      setError("Kompaniya nomi va telefon raqamini kiriting.");
      return;
    }
    setError("");
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 900);
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-bold">So'rovingiz qabul qilindi!</h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted">
          "{plan}" tarifi bo'yicha bizning jamoamiz tez orada siz bilan
          bog'lanadi.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="text-lg font-bold">Reklama uchun murojaat qiling</h3>
      <p className="mt-1 text-sm text-muted">
        Ma'lumotlarni qoldiring, jamoamiz siz bilan bog'lanib tarif va
        joylashuv bo'yicha maslahat beradi.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">
            Kompaniya / brend nomi *
          </label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Masalan: SecureTag MChJ"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">
            Telefon raqami *
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Tarif</label>
          <div className="flex flex-wrap gap-2">
            {plans.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlan(p)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  plan === p
                    ? "btn-brand text-white"
                    : "border border-border bg-bg-elevated text-muted hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">
            Qo'shimcha izoh
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Reklama qaysi shaharlarda ko'rinishini xohlaysiz?"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-brand mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
      >
        {status === "submitting" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Murojaat yuborish
      </button>
    </form>
  );
}
