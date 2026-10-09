"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Link2,
  Link2Off,
  Loader2,
  MousePointerClick,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { AdBanner } from "@/lib/ads";

const iconButton =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground disabled:opacity-40";

export default function AdminAdRow({ ad, first, last }: { ad: AdBanner; first: boolean; last: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(ad.title);
  const [linkUrl, setLinkUrl] = useState(ad.linkUrl);
  const [error, setError] = useState("");

  async function patch(body: object): Promise<boolean> {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (await patch({ title, linkUrl })) setEditing(false);
  }

  async function handleDelete() {
    if (!confirm("Bu reklamani o'chirmoqchimisiz?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setBusy(false);
  }

  const ctr = ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(1) : null;

  return (
    <div className={`rounded-2xl border bg-surface p-3 ${ad.active ? "border-border" : "border-dashed border-border opacity-70"}`}>
      <div className="flex gap-3">
        <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-2">
          {ad.mediaType === "video" ? (
            <video src={ad.mediaUrl} className="h-full w-full object-cover" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview thumbnail of arbitrary uploaded media
            <img src={ad.mediaUrl} alt={ad.title || "Reklama"} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold">{ad.title || "Nomsiz"}</p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                ad.active ? "bg-success/15 text-success" : "bg-surface-2 text-muted"
              }`}
            >
              {ad.active ? "Faol" : "Yashirilgan"}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
            {ad.linkUrl ? <Link2 className="h-3 w-3 shrink-0" /> : <Link2Off className="h-3 w-3 shrink-0" />}
            <span className="truncate">{ad.linkUrl || "Havolasiz — bosilmaydi"}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <span className="flex items-center gap-1 font-semibold">
              <Eye className="h-3.5 w-3.5 text-muted" />
              {ad.views.toLocaleString("ru-RU")} ko&apos;rish
            </span>
            {ad.linkUrl && (
              <span className="flex items-center gap-1 font-semibold">
                <MousePointerClick className="h-3.5 w-3.5 text-muted" />
                {ad.clicks.toLocaleString("ru-RU")} bosish
                {ctr && <span className="font-normal text-muted">({ctr}%)</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="mt-3 space-y-2 border-t border-border pt-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nom (ixtiyoriy)"
            aria-label="Nom"
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://... (bo'sh qoldirsa — bosilmaydi)"
            aria-label="Havola"
            inputMode="url"
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="btn-brand flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold text-white disabled:opacity-70"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Saqlash
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setTitle(ad.title);
                setLinkUrl(ad.linkUrl);
                setError("");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Bekor qilish
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
          <button type="button" onClick={() => patch({ move: "up" })} disabled={busy || first} aria-label="Yuqoriga" title="Oldinroq ko'rsatish" className={iconButton}>
            <ArrowUp className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => patch({ move: "down" })} disabled={busy || last} aria-label="Pastga" title="Keyinroq ko'rsatish" className={iconButton}>
            <ArrowDown className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setEditing(true)} disabled={busy} aria-label="Tahrirlash" title="Nom va havolani tahrirlash" className={iconButton}>
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => patch({ active: !ad.active })}
            disabled={busy}
            aria-label={ad.active ? "Yashirish" : "Faollashtirish"}
            title={ad.active ? "Yashirish" : "Faollashtirish"}
            className={iconButton}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : ad.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            aria-label="O'chirish"
            title="O'chirish"
            className={`${iconButton} ml-auto text-danger hover:bg-danger/10 hover:text-danger`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
