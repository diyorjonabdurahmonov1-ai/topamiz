"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PackageCheck } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import ImageUploader from "./ImageUploader";

export default function FoundItForm({
  ownerId,
  listingId,
  loggedIn,
  dict,
}: {
  ownerId: number;
  listingId: number;
  loggedIn: boolean;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const buttonLabel = (
    <>
      <PackageCheck className="h-4 w-4" />
      {dict.listingDetail.foundItButton}
    </>
  );
  const buttonClassName =
    "flex w-full items-center justify-center gap-2 rounded-2xl border border-success/40 bg-success/10 px-5 py-3 text-sm font-bold text-success hover:bg-success/20";

  if (!loggedIn) {
    return (
      <Link href="/kirish" className={buttonClassName}>
        {buttonLabel}
      </Link>
    );
  }

  async function handleSend() {
    if (!message.trim()) {
      setError(dict.listingDetail.foundItRequiredError);
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/messages/${ownerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: message, photoUrls, listingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? dict.listingDetail.foundItGenericError);
      setSent(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.listingDetail.foundItGenericError);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm font-semibold text-success">
        <CheckCircle2 className="h-4 w-4" />
        {dict.listingDetail.foundItSuccess}
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName}>
        {buttonLabel}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-success/30 bg-success/5 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-success">{buttonLabel}</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder={dict.listingDetail.foundItPlaceholder}
        className="mt-3 w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40"
      />
      <p className="mb-1.5 mt-3 text-xs font-semibold text-muted">
        {dict.listingDetail.foundItPhotosLabel}
      </p>
      <ImageUploader onChange={setPhotoUrls} dict={dict} />
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-2"
        >
          {dict.profile.cancel}
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="btn-brand flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {dict.listingDetail.foundItSend}
        </button>
      </div>
    </div>
  );
}
