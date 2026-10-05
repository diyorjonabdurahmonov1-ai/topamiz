"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteAccountButton({
  label,
  confirmText,
  errorText,
  className = "",
}: {
  label: string;
  confirmText: string;
  errorText: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmText)) return;
    setLoading(true);
    const res = await fetch("/api/profile", { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    setLoading(false);
    alert(errorText);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className={`flex items-center gap-1.5 text-sm font-semibold text-danger hover:text-danger/80 disabled:opacity-60 ${className}`}
    >
      <Trash2 className="h-4 w-4" />
      {label}
    </button>
  );
}
