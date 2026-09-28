"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import type { ListingStatus } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";

export default function ResolveToggleButton({
  listingId,
  status,
  dict,
  className = "",
}: {
  listingId: string;
  status: ListingStatus;
  dict: Dictionary;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const resolved = status === "resolved";

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: resolved ? "active" : "resolved" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-70 ${
        resolved
          ? "border-border text-muted hover:text-foreground"
          : "border-success/40 bg-success/10 text-success hover:bg-success/20"
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : resolved ? (
        <RotateCcw className="h-3.5 w-3.5" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}
      {resolved ? dict.myListings.markActive : dict.myListings.markResolved}
    </button>
  );
}
