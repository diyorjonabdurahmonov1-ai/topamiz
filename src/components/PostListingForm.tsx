"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import type { CategoryId, ListingKind } from "@/lib/types";
import { categories, cities } from "@/lib/data";

type Status = "idle" | "submitting" | "success";

export default function PostListingForm() {
  const [kind, setKind] = useState<ListingKind>("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryId>("hujjatlar");
  const [city, setCity] = useState(cities[0]);
  const [reward, setReward] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !contactName.trim() || !contactPhone.trim()) {
      setError("Iltimos, * bilan belgilangan barcha maydonlarni to'ldiring.");
      return;
    }
    setError("");
    setStatus("submitting");
    // No backend is wired up yet — this simulates the save so the flow can be
    // demoed end-to-end; swap for a real API call once one exists.
    setTimeout(() => setStatus("success"), 900);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("hujjatlar");
    setCity(cities[0]);
    setReward("");
    setContactName("");
    setContactPhone("");
    setStatus("idle");
  }

  if (status === "success") {
    return (
      <div className="animate-fade-up flex flex-col items-center rounded-3xl border border-border bg-surface p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold">E'lon muvaffaqiyatli joylandi!</h2>
        <p className="mt-2 max-w-md text-sm text-muted">
          "{title}" e'loni {kind === "lost" ? "yo'qolgan" : "topilgan"} buyumlar
          ro'yxatiga qo'shildi. AI yordamchi mos e'lonlarni avtomatik qidirib
          topishga harakat qiladi.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-surface-2"
          >
            Yana e'lon joylash
          </button>
          <Link
            href="/elonlar"
            className="btn-brand rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            Barcha e'lonlarni ko'rish
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-bold">Buyum turi</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(
            [
              { id: "lost", label: "Men buyum yo'qotdim" },
              { id: "found", label: "Men buyum topdim" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setKind(opt.id)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                kind === opt.id
                  ? "border-brand-via bg-brand-via/10 text-foreground"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-bold">Asosiy ma'lumot</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              Sarlavha *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: Qora rangli hamyon"
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              Tavsif *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Buyum qanday ko'rinishga ega, qayerda va qachon yo'qolgan/topilgan..."
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">Turkum</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">Shahar</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-elevated px-9 py-2.5 text-sm focus:outline-none"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <ImagePlus className="h-4 w-4" />
          Rasm qo'shish
        </h2>
        <div className="mt-3 flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-border text-center text-sm text-muted">
          Rasmni shu yerga tashlang yoki bosib tanlang
        </div>
      </div>

      {kind === "lost" && (
        <div className="rounded-2xl border border-accent-gold/30 bg-accent-gold/5 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-accent-gold">
            <Sparkles className="h-4 w-4" />
            Mukofot taklif qilish (ixtiyoriy)
          </h2>
          <p className="mt-1 text-xs text-muted">
            Mukofot taklif qilish buyumingiz tezroq topilishiga yordam beradi.
          </p>
          <input
            type="number"
            min={0}
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="Masalan: 200000"
            className="mt-3 w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
          />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-bold">Aloqa ma'lumotlari</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              Ismingiz *
            </label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ism Familiya"
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              Telefon raqami *
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full rounded-xl border border-border bg-bg-elevated px-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white disabled:opacity-70"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Joylanmoqda...
          </>
        ) : (
          "E'lonni joylash"
        )}
      </button>
    </form>
  );
}
