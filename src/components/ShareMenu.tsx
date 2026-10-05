"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Link2, Loader2, Search, Share2, Users, X } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import Avatar from "./Avatar";

type View = "menu" | "pick" | "sent";

export default function ShareMenu({
  listingId,
  title,
  loggedIn,
  dict,
  variant = "default",
  className = "",
}: {
  listingId: string;
  title: string;
  loggedIn: boolean;
  dict: Dictionary;
  variant?: "default" | "reel";
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AuthUser[]>([]);
  const [sendingTo, setSendingTo] = useState<number | null>(null);
  const [sentVia, setSentVia] = useState<"forward" | "clipboard" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listingUrl = `${SITE_URL}/elonlar/${listingId}`;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // An empty query just leaves the previous results in state — the list
    // below is only ever rendered while `query` is non-empty, so stale
    // results sitting unused in state aren't visible.
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

  function openMenu() {
    if (!loggedIn) {
      router.push("/kirish");
      return;
    }
    setView("menu");
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  async function handleExternalShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: listingUrl });
        close();
        return;
      } catch {
        // User cancelled the native share sheet — fall through to clipboard
        // so the tap still does something useful instead of just closing.
      }
    }
    await navigator.clipboard.writeText(listingUrl);
    setSentVia("clipboard");
    setView("sent");
  }

  async function handleForwardTo(recipientId: number) {
    setSendingTo(recipientId);
    try {
      const res = await fetch(`/api/messages/${recipientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: `${title}\n${listingUrl}` }),
      });
      if (!res.ok) throw new Error();
      setSentVia("forward");
      setView("sent");
    } catch {
      // Keep the picker open on failure — the user can just try again.
    } finally {
      setSendingTo(null);
    }
  }

  const buttonClass =
    variant === "reel"
      ? `flex flex-col items-center gap-1 text-white transition-transform active:scale-90 ${className}`
      : `flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground ${className}`;

  return (
    <>
      <button type="button" onClick={openMenu} className={buttonClass}>
        {variant === "reel" ? (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <Share2 className="h-5 w-5" />
          </span>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            {dict.social.shareButton}
          </>
        )}
      </button>

      {open && (
        <div
          className="animate-fade-up fixed inset-0 z-[100] flex items-end justify-center bg-black/70 sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-t-3xl bg-surface sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-bold">{dict.social.shareButton}</h2>
              <button
                type="button"
                onClick={close}
                aria-label={dict.common.close}
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {view === "menu" && (
              <div className="space-y-1 p-3">
                <button
                  type="button"
                  onClick={() => setView("pick")}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-semibold hover:bg-surface-2"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-via/10 text-brand-via">
                    <Users className="h-4.5 w-4.5" />
                  </span>
                  {dict.social.shareToFriend}
                </button>
                <button
                  type="button"
                  onClick={handleExternalShare}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-semibold hover:bg-surface-2"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
                    <Link2 className="h-4.5 w-4.5" />
                  </span>
                  {dict.social.shareExternal}
                </button>
              </div>
            )}

            {view === "pick" && (
              <div className="p-4">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3">
                  <Search className="h-4 w-4 shrink-0 text-muted" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={dict.social.shareSearchPlaceholder}
                    className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
                  {query.trim() && results.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      disabled={sendingTo !== null}
                      onClick={() => handleForwardTo(u.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2 disabled:opacity-60"
                    >
                      <Avatar name={u.name} color={u.avatarColor} avatarUrl={u.avatarUrl} size={32} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{u.name}</span>
                      {sendingTo === u.id && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "sent" && (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
                <p className="text-sm font-bold">
                  {sentVia === "clipboard" ? dict.social.shareLinkCopied : dict.social.shareSentTitle}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
