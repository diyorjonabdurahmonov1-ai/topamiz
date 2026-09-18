"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Phone, User } from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Parollar mos kelmadi");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xatolik yuz berdi");
      router.push("/profil");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-6">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">Ismingiz</label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ism Familiya"
            className="w-full rounded-xl border border-border bg-bg-elevated px-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">Telefon raqam</label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className="w-full rounded-xl border border-border bg-bg-elevated px-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">Parol</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kamida 6 ta belgi"
            className="w-full rounded-xl border border-border bg-bg-elevated px-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">Parolni tasdiqlang</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Parolni qayta yozing"
            className="w-full rounded-xl border border-border bg-bg-elevated px-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Ro'yxatdan o'tish
      </button>

      <p className="text-center text-xs text-muted">
        Hisobingiz bormi?{" "}
        <Link href="/kirish" className="font-semibold text-brand-via hover:text-brand-to">
          Kirish
        </Link>
      </p>
    </form>
  );
}
