"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import GoogleLoginButton from "../GoogleLoginButton";
import LegalSheet, { type LegalDoc } from "./LegalSheet";

type Tab = "login" | "register";
type View =
  | { name: "login" }
  | { name: "register-details" }
  | { name: "register-code" }
  | { name: "exists" }
  | { name: "not-found" }
  | { name: "no-password" }
  | { name: "forgot-phone" }
  | { name: "forgot-code" };

const MIN_PASSWORD = 8;

function formatLocal(digits: string): string {
  const d = digits.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

function passwordScore(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= MIN_PASSWORD) score++;
  if (/[A-Za-zЀ-ӿ]/.test(password) && /\d/.test(password)) score++;
  if (password.length >= 12 || /[^A-Za-z0-9]/.test(password)) score++;
  return Math.max(1, score) as 1 | 2 | 3;
}

// Splits a translated sentence on {placeholders} so links can sit inside it
// in whatever word order each language needs.
function fill(template: string, parts: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((piece, i) => {
    const key = piece.match(/^\{(\w+)\}$/)?.[1];
    return key && key in parts ? <span key={i}>{parts[key]}</span> : piece;
  });
}

export default function AuthPanel({ dict, initialTab }: { dict: Dictionary; initialTab: Tab }) {
  const t = dict.login;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [view, setView] = useState<View>(
    initialTab === "login" ? { name: "login" } : { name: "register-details" }
  );
  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const phone = `+998${phoneDigits}`;
  const phoneValid = phoneDigits.length === 9;
  const passwordValid = password.length >= MIN_PASSWORD && passwordScore(password) >= 2;

  function go(next: View) {
    setError("");
    setView(next);
  }

  function switchTab(next: Tab) {
    setTab(next);
    setPassword("");
    setCode("");
    go(next === "login" ? { name: "login" } : { name: "register-details" });
  }

  function fail(message: string) {
    setError(message);
    setShakeKey((k) => k + 1);
  }

  async function post(url: string, body: object) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { ok: res.ok, data: data ?? {} };
  }

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch {
      fail(t.genericError);
    } finally {
      setBusy(false);
    }
  }

  function signedIn() {
    // refresh() re-renders the server parts (navbar, bottom nav) with the
    // new session.
    router.replace("/profil");
    router.refresh();
  }

  function sendCode(purpose: "register" | "reset", onSent: () => void) {
    return run(async () => {
      const { ok, data } = await post("/api/auth/phone/send", { phone, purpose });
      if (typeof data.resendIn === "number") setResendIn(data.resendIn);
      if (data.code === "exists") return go({ name: "exists" });
      if (data.code === "not-found") return go({ name: "not-found" });
      if (!ok) return fail(String(data.error ?? t.genericError));
      setCode("");
      onSent();
    });
  }

  function submitLogin(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      const { ok, data } = await post("/api/auth/phone/login", { phone, password });
      if (data.code === "not-found") return go({ name: "not-found" });
      if (data.code === "no-password") return go({ name: "no-password" });
      if (!ok) return fail(String(data.error ?? t.genericError));
      signedIn();
    });
  }

  function submitRegisterDetails(e: FormEvent) {
    e.preventDefault();
    if (!consent) return fail(t.consentRequired);
    void sendCode("register", () => go({ name: "register-code" }));
  }

  function submitRegisterCode(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      const { ok, data } = await post("/api/auth/phone/register", {
        phone,
        code,
        name,
        password,
        acceptTerms: consent,
      });
      if (data.code === "exists") return go({ name: "exists" });
      if (!ok) return fail(String(data.error ?? t.genericError));
      signedIn();
    });
  }

  function submitForgotPhone(e: FormEvent) {
    e.preventDefault();
    void sendCode("reset", () => go({ name: "forgot-code" }));
  }

  function submitForgotCode(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      const { ok, data } = await post("/api/auth/phone/reset", { phone, code, password });
      if (!ok) return fail(String(data.error ?? t.genericError));
      signedIn();
    });
  }

  const docLink = (doc: LegalDoc, label: string) => (
    <button
      type="button"
      onClick={() => setLegalDoc(doc)}
      className="font-semibold text-brand-via underline decoration-brand-via/30 underline-offset-2 hover:decoration-brand-via"
    >
      {label}
    </button>
  );
  const legalLinks = {
    terms: docLink("terms", t.termsLink),
    privacy: docLink("privacy", t.privacyLink),
    safety: docLink("safety", t.safetyLink),
  };

  const errorLine = error && (
    <p key={shakeKey} className="animate-shake rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-medium text-danger">
      {error}
    </p>
  );

  const phoneField = (
    <Field icon={<Phone className="h-4 w-4" />} label={t.phoneLabel}>
      <span className="pointer-events-none select-none text-sm font-semibold">+998</span>
      <input
        value={formatLocal(phoneDigits)}
        onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, "").replace(/^998(?=\d{9})/, "").slice(0, 9))}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="90 123 45 67"
        aria-label={t.phoneLabel}
        className="min-w-0 flex-1 bg-transparent text-sm tracking-wide outline-none placeholder:text-muted/60"
      />
    </Field>
  );

  const resendRow = (purpose: "register" | "reset", back: View) => (
    <div className="flex items-center justify-between text-xs">
      <button type="button" onClick={() => go(back)} className="flex items-center gap-1 font-semibold text-muted hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        {t.changeNumber}
      </button>
      {resendIn > 0 ? (
        <span className="tabular-nums text-muted">
          {t.resend} · {resendIn}s
        </span>
      ) : (
        <button type="button" disabled={busy} onClick={() => sendCode(purpose, () => {})} className="font-semibold text-brand-via">
          {t.resend}
        </button>
      )}
    </div>
  );

  let body: ReactNode;
  switch (view.name) {
    case "login":
      body = (
        <form onSubmit={submitLogin} className="space-y-3">
          {phoneField}
          <PasswordField value={password} onChange={setPassword} label={t.passwordLabel} dict={dict} autoComplete="current-password" />
          <div className="flex justify-end">
            <button type="button" onClick={() => go({ name: "forgot-phone" })} className="text-xs font-semibold text-brand-via hover:underline">
              {t.forgotLink}
            </button>
          </div>
          {errorLine}
          <SubmitButton busy={busy} disabled={!phoneValid || !password}>
            {t.loginButton}
          </SubmitButton>
        </form>
      );
      break;

    case "register-details":
      body = (
        <form onSubmit={submitRegisterDetails} className="space-y-3">
          <Steps current={1} dict={dict} />
          <Field icon={<User className="h-4 w-4" />} label={t.nameLabel}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder={t.namePlaceholder}
              aria-label={t.nameLabel}
              maxLength={80}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60"
            />
          </Field>
          {phoneField}
          <PasswordField value={password} onChange={setPassword} label={t.passwordLabel} dict={dict} autoComplete="new-password" showStrength />
          <Consent checked={consent} onChange={setConsent}>
            {fill(t.consentText, legalLinks)}
          </Consent>
          {errorLine}
          <SubmitButton busy={busy} disabled={!consent || name.trim().length < 2 || !phoneValid || !passwordValid}>
            {t.registerContinue}
          </SubmitButton>
          {!consent && <p className="text-center text-[11px] text-muted">{t.consentRequired}</p>}
        </form>
      );
      break;

    case "register-code":
      body = (
        <form onSubmit={submitRegisterCode} className="space-y-4">
          <Steps current={2} dict={dict} />
          <p className="text-center text-sm text-muted">
            {t.codeSentTo} <span className="font-semibold text-foreground">{phone}</span>
          </p>
          <OtpInput value={code} onChange={setCode} label={t.codeLabel} />
          {errorLine}
          <SubmitButton busy={busy} disabled={code.length !== 6}>
            {t.registerSubmit}
          </SubmitButton>
          {resendRow("register", { name: "register-details" })}
        </form>
      );
      break;

    case "exists":
      body = (
        <Notice
          tone="brand"
          icon={<UserCheck className="h-6 w-6" />}
          title={t.existsTitle}
          text={fill(t.existsBody, { phone: <b className="text-foreground">{phone}</b> })}
        >
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setPassword("");
              go({ name: "login" });
            }}
            className="btn-brand w-full rounded-xl px-5 py-3 text-sm font-bold text-white"
          >
            {t.loginButton}
          </button>
          <button type="button" onClick={() => { setTab("login"); go({ name: "forgot-phone" }); }} className="text-xs font-semibold text-brand-via">
            {t.forgotLink}
          </button>
        </Notice>
      );
      break;

    case "not-found":
      body = (
        <Notice tone="muted" icon={<UserX className="h-6 w-6" />} title={t.notFoundTitle} text={t.notFoundBody}>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setPassword("");
              go({ name: "register-details" });
            }}
            className="btn-brand w-full rounded-xl px-5 py-3 text-sm font-bold text-white"
          >
            {t.tabRegister}
          </button>
          <button type="button" onClick={() => go(tab === "login" ? { name: "login" } : { name: "register-details" })} className="text-xs font-semibold text-muted">
            {t.changeNumber}
          </button>
        </Notice>
      );
      break;

    case "no-password":
      body = (
        <Notice tone="gold" icon={<KeyRound className="h-6 w-6" />} title={t.noPasswordTitle} text={t.noPasswordBody}>
          <button
            type="button"
            onClick={() => sendCode("reset", () => go({ name: "forgot-code" }))}
            disabled={busy}
            className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.setPassword}
          </button>
          {errorLine}
        </Notice>
      );
      break;

    case "forgot-phone":
      body = (
        <form onSubmit={submitForgotPhone} className="space-y-3">
          <BackHeader onBack={() => go({ name: "login" })} title={t.forgotTitle} subtitle={t.forgotSubtitle} />
          {phoneField}
          {errorLine}
          <SubmitButton busy={busy} disabled={!phoneValid}>
            {t.sendCode}
          </SubmitButton>
        </form>
      );
      break;

    case "forgot-code":
      body = (
        <form onSubmit={submitForgotCode} className="space-y-4">
          <BackHeader onBack={() => go({ name: "forgot-phone" })} title={t.forgotTitle} />
          <p className="text-center text-sm text-muted">
            {t.codeSentTo} <span className="font-semibold text-foreground">{phone}</span>
          </p>
          <OtpInput value={code} onChange={setCode} label={t.codeLabel} />
          <PasswordField value={password} onChange={setPassword} label={t.newPasswordLabel} dict={dict} autoComplete="new-password" showStrength />
          {errorLine}
          <SubmitButton busy={busy} disabled={code.length !== 6 || !passwordValid}>
            {t.resetSubmit}
          </SubmitButton>
          {resendRow("reset", { name: "forgot-phone" })}
        </form>
      );
      break;
  }

  const showTabs = view.name === "login" || view.name === "register-details";

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/80 p-5 shadow-2xl shadow-brand-via/5 backdrop-blur-xl sm:p-6">
        {showTabs && (
          <div className="relative mb-5 grid grid-cols-2 rounded-2xl bg-bg-elevated p-1">
            <span
              aria-hidden
              className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-gradient-to-r from-brand-from to-brand-via shadow-lg shadow-brand-via/30 transition-transform duration-300 ease-out ${
                tab === "register" ? "translate-x-full" : ""
              }`}
            />
            {(["login", "register"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => switchTab(id)}
                className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-colors ${
                  tab === id ? "text-white" : "text-muted hover:text-foreground"
                }`}
              >
                {id === "login" ? <Lock className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                {id === "login" ? t.tabLogin : t.tabRegister}
              </button>
            ))}
          </div>
        )}

        <div key={view.name} className="animate-fade-up">
          {body}
        </div>

        {showTabs && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" />
              {t.orDivider}
              <span className="h-px flex-1 bg-border" />
            </div>
            {tab === "register" && !consent ? (
              <div className="space-y-1.5">
                <div aria-disabled className="pointer-events-none select-none opacity-40">
                  <GoogleLoginButton label={dict.login.googleButton} />
                </div>
                <p className="text-center text-[11px] text-muted">{t.googleNeedsConsent}</p>
              </div>
            ) : (
              <GoogleLoginButton label={dict.login.googleButton} />
            )}
            {tab === "login" && (
              <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
                {fill(t.loginFinePrint, legalLinks)}
              </p>
            )}
          </>
        )}
      </div>

      {legalDoc && (
        <LegalSheet
          doc={legalDoc}
          onDocChange={setLegalDoc}
          onClose={() => setLegalDoc(null)}
          onAgree={() => {
            setConsent(true);
            setLegalDoc(null);
            setError("");
          }}
          dict={dict}
        />
      )}
    </div>
  );
}

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      <span className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-elevated px-3.5 py-3 transition-colors focus-within:border-brand-via/60 focus-within:ring-2 focus-within:ring-brand-via/25">
        <span className="text-muted">{icon}</span>
        {children}
      </span>
    </label>
  );
}

function PasswordField({
  value,
  onChange,
  label,
  dict,
  autoComplete,
  showStrength = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  dict: Dictionary;
  autoComplete: string;
  showStrength?: boolean;
}) {
  const t = dict.login;
  const [visible, setVisible] = useState(false);
  const score = passwordScore(value);
  const strength = [
    null,
    { label: t.strengthWeak, color: "bg-danger", text: "text-danger" },
    { label: t.strengthOk, color: "bg-accent-gold", text: "text-accent-gold" },
    { label: t.strengthStrong, color: "bg-success", text: "text-success" },
  ][score];

  return (
    <div>
      <Field icon={<Lock className="h-4 w-4" />} label={label}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder="••••••••"
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t.hidePassword : t.showPassword}
          className="text-muted hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Field>
      {showStrength && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  strength && score >= n ? strength.color : "bg-border"
                }`}
              />
            ))}
          </div>
          <span className={`w-24 text-right text-[11px] font-semibold ${strength ? strength.text : "text-muted"}`}>
            {strength ? strength.label : t.passwordHint}
          </span>
        </div>
      )}
    </div>
  );
}

// Six visual boxes over one real input — keeps paste and the phone's SMS
// code autofill (autocomplete="one-time-code") working.
function OtpInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <div className="grid grid-cols-6 gap-2" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => {
          const active = focused && (i === value.length || (i === 5 && value.length === 6));
          return (
            <span
              key={i}
              className={`flex aspect-[4/5] items-center justify-center rounded-xl border text-xl font-extrabold transition-all ${
                value[i]
                  ? "border-brand-via/50 bg-brand-via/10 text-foreground"
                  : active
                    ? "border-brand-via bg-bg-elevated ring-2 ring-brand-via/30"
                    : "border-border bg-bg-elevated"
              }`}
            >
              {value[i] ?? (active ? <span className="h-5 w-0.5 animate-pulse rounded bg-brand-via" /> : "")}
            </span>
          );
        })}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  );
}

function Consent({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex gap-3 rounded-2xl border p-3.5 transition-colors ${
        checked ? "border-success/40 bg-success/5" : "border-border bg-bg-elevated"
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
          checked ? "scale-105 border-success bg-success text-white" : "border-muted/60"
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      <p className="text-xs leading-relaxed text-muted">{children}</p>
    </div>
  );
}

function Steps({ current, dict }: { current: 1 | 2; dict: Dictionary }) {
  const t = dict.login;
  return (
    <div className="flex items-center gap-2 pb-1">
      {[t.stepDetails, t.stepCode].map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const on = n === current;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                done || on ? "bg-gradient-to-br from-brand-from to-brand-via text-white" : "bg-surface-2 text-muted"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
            </span>
            <span className={`text-xs font-semibold ${on ? "text-foreground" : "text-muted"}`}>{label}</span>
            {n === 1 && <span className={`h-px flex-1 ${done ? "bg-brand-via" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function BackHeader({ onBack, title, subtitle }: { onBack: () => void; title: string; subtitle?: string }) {
  return (
    <div className="pb-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-base font-extrabold">{title}</h2>
      </div>
      {subtitle && <p className="mt-2 text-xs text-muted">{subtitle}</p>}
    </div>
  );
}

function Notice({
  tone,
  icon,
  title,
  text,
  children,
}: {
  tone: "brand" | "muted" | "gold";
  icon: ReactNode;
  title: string;
  text: ReactNode;
  children: ReactNode;
}) {
  const ring =
    tone === "brand"
      ? "from-brand-from to-brand-via text-white"
      : tone === "gold"
        ? "from-accent-gold to-brand-via text-white"
        : "from-surface-2 to-surface-2 text-muted";
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ${ring}`}>{icon}</div>
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="max-w-xs text-sm text-muted">{text}</p>
      <div className="mt-1 flex w-full flex-col items-center gap-3">{children}</div>
    </div>
  );
}

function SubmitButton({ busy, disabled, children }: { busy: boolean; disabled: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
      {children}
    </button>
  );
}
