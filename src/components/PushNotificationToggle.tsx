"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Info, Loader2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import {
  disablePush,
  ensureSubscribed,
  isSubscribed,
  pushAvailability,
  pushFailureCode,
  requestPermission,
} from "@/lib/push-client";
import { reportClientError } from "@/lib/error-report";

type Status = "checking" | "off" | "on" | "busy";

// Why it didn't work, shown only after the visitor tapped the button —
// nothing is ever asked or explained unprompted.
type Notice = "ios-install" | "unsupported" | "denied" | "push-service" | "retry";

// The one place push is turned on or off (profile and notifications pages).
// Nothing pops up on its own anywhere on the site: the visitor taps this,
// and only if it can't work here does it say why.
function installedApp(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function PushNotificationToggle({ dict }: { dict: Dictionary }) {
  const t = dict.notifications;
  const [status, setStatus] = useState<Status>("checking");
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let on = false;
      try {
        on =
          pushAvailability() === "supported" &&
          Notification.permission === "granted" &&
          (await isSubscribed());
      } catch {
        // Can't tell — show the button as off; tapping it will explain.
      }
      if (!cancelled) setStatus(on ? "on" : "off");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Logged to /admin/xatolar with the phone's details, so "doesn't work on
  // some phones" shows up as which phones and which step.
  function fail(err: unknown, action: "enable" | "disable") {
    const code = pushFailureCode(err);
    reportClientError(err instanceof Error ? err : new Error(String(err)), { source: `push-${action}:${code}` });
    setNotice(code === "denied" ? "denied" : code === "push-service" ? "push-service" : "retry");
  }

  async function handleEnable() {
    setNotice(null);
    const availability = pushAvailability();
    if (availability !== "supported") {
      setNotice(availability);
      return;
    }
    if (Notification.permission === "denied") {
      setNotice("denied");
      return;
    }
    setStatus("busy");
    try {
      const permission = await requestPermission();
      if (permission !== "granted") {
        setNotice("denied");
        setStatus("off");
        return;
      }
      await ensureSubscribed();
      setStatus("on");
    } catch (err) {
      fail(err, "enable");
      setStatus("off");
    }
  }

  async function handleDisable() {
    setNotice(null);
    setStatus("busy");
    try {
      await disablePush();
      setStatus("off");
    } catch (err) {
      fail(err, "disable");
      setStatus("on");
    }
  }

  if (status === "checking") return null;

  const noticeText: Record<Notice, { title: string; body: string }> = {
    "ios-install": { title: t.iosInstallTitle, body: t.iosInstallBody },
    unsupported: { title: t.title, body: t.unsupportedBody },
    // In the Android app (or a Home Screen install) there's no address bar
    // to unblock it from — point to the phone's own settings instead.
    denied: { title: dict.profile.pushDenied, body: installedApp() ? t.deniedAppBody : t.deniedBody },
    "push-service": { title: dict.profile.pushError, body: t.pushServiceBody },
    retry: { title: dict.profile.pushError, body: t.pushRetryBody },
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={status === "on" ? handleDisable : handleEnable}
        disabled={status === "busy"}
        aria-pressed={status === "on"}
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
      {notice && (
        <div role="alert" className="animate-fade-in flex max-w-sm gap-2.5 rounded-xl border border-border bg-surface p-3 text-left">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-via" />
          <div>
            <p className="text-xs font-bold">{noticeText[notice].title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{noticeText[notice].body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
