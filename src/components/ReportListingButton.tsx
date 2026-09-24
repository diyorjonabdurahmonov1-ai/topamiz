"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Flag, Loader2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export default function ReportListingButton({
  listingId,
  isLoggedIn,
  dict,
}: {
  listingId: string;
  isLoggedIn: boolean;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isLoggedIn) {
    return (
      <Link
        href="/kirish"
        className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-danger"
      >
        <Flag className="h-3.5 w-3.5" />
        {dict.reportButton.report}
      </Link>
    );
  }

  if (status === "sent") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {dict.reportButton.sent}
      </span>
    );
  }

  async function handleSubmit() {
    setStatus("sending");
    setErrorMessage("");
    try {
      const res = await fetch(`/api/elonlar/${listingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? dict.reportButton.genericError);
      setStatus("sent");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : dict.reportButton.genericError);
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-danger"
      >
        <Flag className="h-3.5 w-3.5" />
        {dict.reportButton.report}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={dict.reportButton.reasonPlaceholder}
          className="w-40 rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-danger/40 sm:w-52"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === "sending"}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-danger/10 px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/20 disabled:opacity-70"
        >
          {status === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3.5 w-3.5" />}
          {dict.reportButton.send}
        </button>
      </div>
      {status === "error" && <p className="text-xs font-medium text-danger">{errorMessage}</p>}
    </div>
  );
}
