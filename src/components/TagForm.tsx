"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Download, Loader2, QrCode } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import ImageUploader from "./ImageUploader";

type Status = "idle" | "submitting" | "success";

export default function TagForm({ dict }: { dict: Dictionary }) {
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
      setError(dict.tags.nameRequiredError);
      return;
    }
    if (imageUrls.length === 0) {
      setError(dict.tags.photoRequiredError);
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
      if (!res.ok) throw new Error(data.error ?? dict.tags.genericError);
      setQrDataUrl(data.qrDataUrl);
      setTagCode(data.tag.code);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.tags.genericError);
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div className="animate-fade-up flex flex-col items-center rounded-3xl border border-border bg-surface p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold">{dict.tags.readyTitle}</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted">{dict.tags.readyBody}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL, not an optimizable asset */}
        <img src={qrDataUrl} alt="QR" className="mt-5 h-48 w-48 rounded-xl border border-border" />
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a
            href={qrDataUrl}
            download={`findo-qr-${tagCode}.png`}
            className="btn-brand flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            {dict.tags.downloadButton}
          </a>
          <Link
            href="/mening-belgilarim"
            className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-surface-2"
          >
            {dict.tags.myTagsLink}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-bold">{dict.tags.aboutItemHeading}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              {dict.tags.itemNameLabel}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={dict.tags.itemNamePlaceholder}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              {dict.tags.itemDescLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={dict.tags.itemDescPlaceholder}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <QrCode className="h-4 w-4" />
          {dict.tags.photoHeading}
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
            {dict.tags.creating}
          </>
        ) : (
          dict.tags.submit
        )}
      </button>
    </form>
  );
}
