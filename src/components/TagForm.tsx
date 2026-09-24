"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Download, Loader2, QrCode } from "lucide-react";
import ImageUploader from "./ImageUploader";

type Status = "idle" | "submitting" | "success";

export default function TagForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [tagCode, setTagCode] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Buyum nomi va tasnifini kiriting");
      return;
    }
    if (imageUrls.length === 0) {
      setError("Kamida bitta rasm yuklang");
      return;
    }
    setError("");
    setStatus("submitting");
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, photoUrls: imageUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xatolik yuz berdi");
      setQrDataUrl(data.qrDataUrl);
      setTagCode(data.tag.code);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div className="animate-fade-up flex flex-col items-center rounded-3xl border border-border bg-surface p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold">QR-belgi tayyor!</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted">
          Buni chop eting yoki saqlab, buyumingizga yopishtiring. Kimdir uni
          topib skaner qilsa, shu belgi haqidagi ma'lumot va sizga xabar
          yozish oynasi chiqadi.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL, not an optimizable asset */}
        <img src={qrDataUrl} alt="QR kod" className="mt-5 h-48 w-48 rounded-xl border border-border" />
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a
            href={qrDataUrl}
            download={`topamiz-qr-${tagCode}.png`}
            className="btn-brand flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            QR-kodni yuklab olish
          </a>
          <Link
            href="/mening-belgilarim"
            className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-surface-2"
          >
            Mening belgilarim
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-bold">Buyum haqida</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">Buyum nomi *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: Uy kalitlari, Noutbuk sumkasi"
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              Maxsus belgilari yoki tasnifi *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Buyumni tanib olish uchun: rangi, brendi, chizig'i, naqshi va h.k."
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <QrCode className="h-4 w-4" />
          Rasm (1-2 tomondan) *
        </h2>
        <div className="mt-3">
          <ImageUploader onChange={setImageUrls} />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white disabled:opacity-70"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Yaratilmoqda...
          </>
        ) : (
          "QR-belgi yaratish"
        )}
      </button>
    </form>
  );
}
