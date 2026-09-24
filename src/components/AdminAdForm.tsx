"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

export default function AdminAdForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Rasm, video yoki GIF tanlang");
      return;
    }
    if (!linkUrl.trim()) {
      setError("Havola kiriting");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("linkUrl", linkUrl.trim());
      body.append("title", title.trim());
      const res = await fetch("/api/admin/ads", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xatolik yuz berdi");
      setLinkUrl("");
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">
          Rasm / video / GIF *
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
        />
        <p className="mt-1 text-xs text-muted">JPG, PNG, WEBP, GIF, MP4, WEBM · 15MB gacha</p>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">Havola (link) *</label>
        <input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">Nom (ixtiyoriy)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Masalan: SecureTag"
          className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
        />
      </div>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="btn-brand flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-70"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Qo'shish
      </button>
    </form>
  );
}
