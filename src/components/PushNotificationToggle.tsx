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
  type PushFailure,
} from "@/lib/push-client";
import { reportClientError } from "@/lib/error-report";

type Status = "checking" | "ios-install" | "unsupported" | "off" | "on" | "denied" | "busy" | "error";

export default function PushNotificationToggle({ dict }: { dict: Dictionary }) {
  const [status, setStatus] = useState<Status>("checking");
  const [failure, setFailure] = useState<PushFailure | null>(null);

  // Logged to /admin/xatolar with the phone's details, so "doesn't work on
  // some phones" shows up as which phones and which step.
  function fail(err: unknown, action: "enable" | "disable") {
    const code = pushFailureCode(err);
    reportClientError(err instanceof Error ? err : new Error(String(err)), { source: `push-${action}:${code}` });
    setFailure(code);
    setStatus(code === "denied" ? "denied" : "error");
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const availability = pushAvailability();
      if (availability !== "supported") {
        if (!cancelled) setStatus(availability);
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
    setFailure(null);
    try {
      const permission = await requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      await ensureSubscribed();
      setStatus("on");
    } catch (err) {
      fail(err, "enable");
    }
  }

  async function handleDisable() {
    setStatus("busy");
    setFailure(null);
    try {
      await disablePush();
      setStatus("off");
    } catch (err) {
      fail(err, "disable");
    }
  }

  if (status === "checking") return null;

  // Never just disappear: say why notifications aren't available here and
  // what would make them work.
  if (status === "ios-install" || status === "unsupported" || status === "denied") {
    const t = dict.notifications;
    return (
      <div className="flex max-w-sm gap-2.5 rounded-xl border border-border bg-surface p-3 text-left">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-via" />
        <div>
          <p className="text-xs font-bold">{status === "ios-install" ? t.iosInstallTitle : status === "denied" ? dict.profile.pushDenied : t.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {status === "ios-install" ? t.iosInstallBody : status === "denied" ? t.deniedBody : t.unsupportedBody}
          </p>
        </div>
      </div>
    );
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
      {status === "error" && (
        <p className="max-w-xs text-center text-xs font-medium leading-relaxed text-danger">
          {failure === "push-service" ? dict.notifications.pushServiceBody : dict.notifications.pushRetryBody}
        </p>
      )}
    </div>
  );
}
