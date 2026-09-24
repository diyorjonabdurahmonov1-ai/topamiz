"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton({ label, className = "" }: { label: string; className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-danger disabled:opacity-60 ${className}`}
    >
      <LogOut className="h-4 w-4" />
      {label}
    </button>
  );
}
