"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import Avatar from "./Avatar";

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AuthUser[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) return;
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Ism yoki telefon raqam bo'yicha izlang..."
          className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          {results.length > 0 ? (
            results.map((u) => (
              <Link
                key={u.id}
                href={`/xabarlar/${u.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2"
              >
                <Avatar name={u.name} color={u.avatarColor} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <p className="truncate text-xs text-muted">{u.phone}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-muted">Hech kim topilmadi</p>
          )}
        </div>
      )}
    </div>
  );
}
