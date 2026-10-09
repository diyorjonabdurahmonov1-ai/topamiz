"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { disablePush, ensureSubscribed, isSubscribed, pushSupported } from "@/lib/push-client";

type Status = "checking" | "unsupported" | "off" | "on" | "denied" | "busy" | "error";

export default function PushNotificationToggle({ dict }: { dict: Dictionary }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!pushSupported()) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const on = Notification.permission === "granted" && (await isSubscribed());
        if (!cancelled) setStatus(on ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnable() {
    setStatus("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      await ensureSubscribed();
      setStatus("on");
    } catch {
      setStatus("error");
    }
  }

  async function handleDisable() {
    setStatus("busy");
    try {
      await disablePush();
      setStatus("off");
    } catch {
      setStatus("error");
    }
  }

  if (status === "unsupported" || status === "checking") return null;

  if (status === "denied") {
    return <p className="text-center text-xs text-muted">{dict.profile.pushDenied}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={status === "on" ? handleDisable : handleEnable}
        disabled={status === "busy"}
        className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-70 ${
          status === "on"
            ? "border-success/40 bg-success/10 text-success"
            : "border-border text-muted hover:text-foreground"
        }`}
      >
        {status === "busy" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : status === "on" ? (
          <Bell className="h-3.5 w-3.5" />
        ) : (
          <BellOff className="h-3.5 w-3.5" />
        )}
        {status === "on" ? dict.profile.pushEnabled : dict.profile.pushEnable}
      </button>
      {status === "error" && <p className="text-xs font-medium text-danger">{dict.profile.pushError}</p>}
    </div>
  );
}
