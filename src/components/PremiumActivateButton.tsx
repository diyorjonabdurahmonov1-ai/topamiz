"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

export default function PremiumActivateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleActivate() {
    setLoading(true);
    const res = await fetch("/api/premium/activate", { method: "POST" });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleActivate}
      disabled={loading}
      className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white disabled:opacity-70"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      Premium'ni faollashtirish (demo)
    </button>
  );
}
