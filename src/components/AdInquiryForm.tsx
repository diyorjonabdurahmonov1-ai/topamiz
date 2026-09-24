"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export default function AdInquiryForm({ dict }: { dict: Dictionary }) {
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!company.trim() || !phone.trim()) {
      setError(dict.ads.requiredError);
      return;
    }
    setError("");
    setStatus("submitting");
    try {
      const res = await fetch("/api/ads/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, phone, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || dict.ads.genericError);
        setStatus("idle");
        return;
      }
      setStatus("success");
    } catch {
      setError(dict.ads.genericError);
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-bold">{dict.ads.successTitle}</h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted">{dict.ads.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="text-lg font-bold">{dict.ads.inquiryHeading}</h3>
      <p className="mt-1 text-sm text-muted">{dict.ads.inquirySubtitle}</p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">{dict.ads.companyLabel}</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={dict.ads.companyPlaceholder}
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">{dict.ads.phoneLabel}</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={dict.ads.phonePlaceholder}
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">{dict.ads.commentLabel}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder={dict.ads.commentPlaceholder}
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
        {dict.ads.submit}
      </button>
    </form>
  );
}
