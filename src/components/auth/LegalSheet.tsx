"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FileText, ShieldCheck, ShieldAlert, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { PRIVACY_SECTIONS, SAFETY_RULES, TERMS_SECTIONS } from "@/lib/legal";

export type LegalDoc = "terms" | "privacy" | "safety";

// Reads the legal documents right on the sign-up form, so the poster
// doesn't lose what they've typed by navigating away to read them.
export default function LegalSheet({
  doc,
  onDocChange,
  onClose,
  onAgree,
  dict,
}: {
  doc: LegalDoc;
  onDocChange: (doc: LegalDoc) => void;
  onClose: () => void;
  onAgree: () => void;
  dict: Dictionary;
}) {
  const t = dict.login;
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [doc]);

  const docs: { id: LegalDoc; label: string; icon: typeof FileText }[] = [
    { id: "terms", label: t.termsLink, icon: FileText },
    { id: "privacy", label: t.privacyLink, icon: ShieldCheck },
    { id: "safety", label: t.safetyLink, icon: ShieldAlert },
  ];

  // Portaled to <body> so it always sits above the site's fixed nav bars,
  // whatever stacking context the form itself lives in.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button type="button" aria-label={t.close} onClick={onClose} className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="animate-sheet-up relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-bg-elevated shadow-2xl sm:max-w-xl sm:rounded-3xl">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-center gap-2 px-4 pb-3 pt-3">
          <div className="flex flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {docs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onDocChange(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  doc === id
                    ? "bg-gradient-to-r from-brand-from to-brand-via text-white shadow"
                    : "bg-surface-2 text-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-4">
          {doc === "safety"
            ? SAFETY_RULES.map((rule) => (
                <div key={rule.title} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-via/10 text-brand-via">
                    <rule.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{rule.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{rule.body}</p>
                  </div>
                </div>
              ))
            : (doc === "terms" ? TERMS_SECTIONS : PRIVACY_SECTIONS).map((section) => (
                <div key={section.title} className="rounded-2xl border border-border bg-surface p-4">
                  <h3 className="text-sm font-bold">{section.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{section.body}</p>
                </div>
              ))}
        </div>

        <div className="border-t border-border bg-bg-elevated p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onAgree}
            className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
          >
            <ShieldCheck className="h-4 w-4" />
            {t.readAndAgree}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
