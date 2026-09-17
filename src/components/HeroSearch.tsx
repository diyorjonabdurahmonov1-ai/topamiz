"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "lost" | "found">("all");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (kind !== "all") params.set("kind", kind);
    router.push(`/elonlar${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex justify-center gap-2">
        {[
          { id: "all", label: "Barchasi" },
          { id: "lost", label: "Yo'qoldi" },
          { id: "found", label: "Topildi" },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setKind(opt.id as typeof kind)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              kind === opt.id
                ? "btn-brand text-white"
                : "border border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass mx-auto flex max-w-2xl items-center gap-2 rounded-2xl p-2 shadow-xl"
      >
        <Search className="ml-2 h-5 w-5 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Masalan: qora hamyon, iPhone, mushuk..."
          className="w-full bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          className="btn-brand shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
        >
          Qidirish
        </button>
      </form>
    </div>
  );
}
