"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { ensureSubscribed, getRegistration, pushAvailability } from "@/lib/push-client";

const DISMISS_KEY = "findo-push-prompt-dismissed";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const POLL_MS = 30_000;
const TOAST_MS = 6_000;

interface Toast {
  title: string;
  body: string;
  url: string;
}

interface Counts {
  messages: number;
  notifications: number;
}

// Browsers only let a page make sound after the visitor has interacted with
// it, so the audio context is created on the first tap/keypress.
let audioCtx: AudioContext | null = null;

function unlockAudio() {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
  } catch {
    // No Web Audio — the toast still shows.
  }
}

// A short two-note chime, synthesised so there's no sound file to load.
function playChime() {
  const ctx = audioCtx;
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    for (const [freq, offset] of [
      [880, 0],
      [1318.5, 0.13],
    ]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.45);
    }
    navigator.vibrate?.(150);
  } catch {
    // Best-effort.
  }
}

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

// Site-wide for signed-in users:
// - keeps this browser's push subscription alive, and asks once (until
//   dismissed for a week) to turn notifications on;
// - while the site is open, chimes and shows a toast when something new
//   arrives — via the service worker when push is on, otherwise by polling —
//   and refreshes the page so the unread badges update.
export default function NotificationCenter({
  dict,
  initialCounts,
}: {
  dict: Dictionary;
  initialCounts: Counts;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // "ios-install": an iPhone in Safari, where push only works once Findo is
  // added to the Home Screen — show how instead of an enable button.
  const [prompt, setPrompt] = useState<"enable" | "ios-install" | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const counts = useRef<Counts>(initialCounts);
  const pathRef = useRef(pathname);
  const t = dict.notifications;

  useEffect(() => {
    counts.current = initialCounts;
  }, [initialCounts]);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const announce = useCallback(
    (next: Toast) => {
      playChime();
      // Already looking at that chat or page — the sound is enough.
      if (next.url !== pathRef.current) setToast(next);
      router.refresh();
    },
    [router]
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    const availability = pushAvailability();
    let cancelled = false;
    if (availability === "ios-install") {
      void Promise.resolve().then(() => {
        if (!cancelled && !recentlyDismissed()) setPrompt("ios-install");
      });
    }
    if (availability !== "supported") {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      if (Notification.permission === "granted") {
        await ensureSubscribed().catch(() => {});
        return;
      }
      if (Notification.permission === "default" && !recentlyDismissed()) {
        await getRegistration().catch(() => {});
        if (!cancelled) setPrompt("enable");
      }
    })();

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; payload?: { title?: string; body?: string; url?: string } };
      if (data?.type !== "findo-push" || !data.payload) return;
      announce({
        title: data.payload.title || "Findo",
        body: data.payload.body || "",
        url: data.payload.url || "/bildirishnomalar",
      });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [announce]);

  useEffect(() => {
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/notifications/count", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as Counts & {
          latestMessage: Toast | null;
          latestNotification: Toast | null;
        };
        const prev = counts.current;
        counts.current = { messages: next.messages, notifications: next.notifications };
        if (next.messages > prev.messages) {
          announce(next.latestMessage ?? { title: dict.nav.messages, body: t.toastNew, url: "/xabarlar" });
        } else if (next.notifications > prev.notifications) {
          announce(next.latestNotification ?? { title: t.title, body: t.toastNew, url: "/bildirishnomalar" });
        }
      } catch {
        // Offline for a moment — try again next tick.
      }
    };
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [announce, dict.nav.messages, t.title, t.toastNew]);

  async function enable() {
    unlockAudio();
    setPrompt(null);
    try {
      if ((await Notification.requestPermission()) === "granted") await ensureSubscribed();
    } catch {
      // The profile page's toggle shows the error and lets them retry.
    }
  }

  function later() {
    setPrompt(null);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private mode — the prompt simply comes back next visit.
    }
  }

  return (
    <>
      {toast && (
        <div className="animate-fade-in fixed inset-x-4 top-3 z-[70] mx-auto max-w-sm">
          <Link
            href={toast.url}
            onClick={() => setToast(null)}
            className="flex items-start gap-3 rounded-2xl border border-border bg-bg-elevated p-3.5 shadow-2xl"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-from to-brand-via text-white">
              <Bell className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{toast.title}</span>
              {toast.body && <span className="mt-0.5 line-clamp-2 block text-[13px] text-muted">{toast.body}</span>}
            </span>
            <span className="shrink-0 self-center text-xs font-semibold text-brand-via">{t.toastOpen}</span>
          </Link>
        </div>
      )}

      {prompt && (
        <div className="animate-sheet-up fixed inset-x-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[55] mx-auto max-w-sm rounded-2xl border border-border bg-bg-elevated p-4 shadow-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:mx-0">
          <button
            type="button"
            onClick={later}
            aria-label={t.promptLater}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex gap-3 pr-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-from to-brand-via text-white">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{prompt === "ios-install" ? t.iosInstallTitle : t.promptTitle}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {prompt === "ios-install" ? t.iosInstallBody : t.promptBody}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {prompt === "ios-install" ? (
              <button
                type="button"
                onClick={later}
                className="btn-brand flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
              >
                {t.gotIt}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={enable}
                  className="btn-brand flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                >
                  {t.promptEnable}
                </button>
                <button
                  type="button"
                  onClick={later}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted hover:text-foreground"
                >
                  {t.promptLater}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
