"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

// Says so when the phone loses its connection — otherwise a page that stops
// reacting looks broken, not offline — and, briefly, when it is back. A small
// pill above the bottom navigation: it takes no room and never blocks a tap.
const RESTORED_MS = 3000;

export default function ConnectionBanner({ dict }: { dict: Dictionary }) {
  const [state, setState] = useState<"online" | "offline" | "restored">("online");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const goOffline = () => {
      clearTimeout(timer);
      setState("offline");
    };
    const goOnline = () => {
      setState((current) => (current === "offline" ? "restored" : current));
      clearTimeout(timer);
      timer = setTimeout(() => setState("online"), RESTORED_MS);
    };
    if (!navigator.onLine) goOffline();
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (state === "online") return null;
  const offline = state === "offline";
  const Icon = offline ? WifiOff : Wifi;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[90] flex justify-center px-4 md:bottom-6">
      <div
        role="status"
        aria-live="polite"
        className={`animate-fade-up flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg ${
          offline ? "bg-danger" : "bg-success"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {offline ? dict.common.offlineBanner : dict.common.backOnline}
      </div>
    </div>
  );
}
