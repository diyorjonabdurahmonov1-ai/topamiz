"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Users } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Avatar from "./Avatar";
import PhotoLightbox from "./PhotoLightbox";
import { sizedImage } from "@/lib/image-url";

interface Claimant {
  id: number;
  name: string;
  avatarColor: string;
  avatarUrl: string | null;
  body: string;
  photoUrls: string[];
  createdAt: string;
}

// Owner-only, and only while the listing is still active — lets them see
// everyone who has said "I found this!" and pick one to credit, instead of
// a claim (which could just be someone lying) resolving the listing on its own.
export default function ListingClaimants({ listingId, dict }: { listingId: string; dict: Dictionary }) {
  const router = useRouter();
  const [claimants, setClaimants] = useState<Claimant[] | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/listings/${listingId}/claimants`)
      .then((res) => (res.ok ? res.json() : { claimants: [] }))
      .then((data) => {
        if (!cancelled) setClaimants(data.claimants ?? []);
      })
      .catch(() => {
        if (!cancelled) setClaimants([]);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  async function confirm(claimantId: number) {
    setConfirmingId(claimantId);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", resolvedBy: claimantId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setConfirmingId(null);
    }
  }

  if (!claimants || claimants.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <Users className="h-3.5 w-3.5" />
        {dict.listingDetail.claimantsHeading}
      </p>
      <p className="mt-1.5 text-xs text-muted">{dict.listingDetail.claimantsHint}</p>

      <div className="mt-4 space-y-3">
        {claimants.map((claimant) => (
          <div key={claimant.id} className="rounded-xl border border-border bg-bg-elevated p-3">
            <div className="flex items-center gap-2">
              <Avatar
                name={claimant.name}
                color={claimant.avatarColor}
                avatarUrl={claimant.avatarUrl}
                size={28}
              />
              <span className="text-sm font-semibold">{claimant.name}</span>
            </div>
            {claimant.body && (
              <p className="mt-2 whitespace-pre-line text-sm text-muted">{claimant.body}</p>
            )}
            {claimant.photoUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {claimant.photoUrls.map((url) => (
                  <button key={url} type="button" onClick={() => setLightboxUrl(url)}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- uploaded to /api/uploads at runtime, not a build-time asset */}
                    <img
                      src={sizedImage(url, 240)}
                      alt=""
                      className="h-16 w-16 rounded-lg border border-border object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => confirm(claimant.id)}
              disabled={confirmingId !== null}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-xs font-semibold text-success hover:bg-success/20 disabled:opacity-70"
            >
              {confirmingId === claimant.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {confirmingId === claimant.id
                ? dict.listingDetail.claimantConfirming
                : dict.listingDetail.claimantConfirmButton}
            </button>
          </div>
        ))}
      </div>

      {lightboxUrl && (
        <PhotoLightbox url={lightboxUrl} dict={dict} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}
