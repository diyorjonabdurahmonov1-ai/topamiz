"use client";

import { useEffect } from "react";
import { hasActiveVideoUpload } from "@/lib/video-upload-store";
import { listenForAppState } from "@/lib/native-app-client";
import { isNativeApp } from "@/lib/native-push";

// Inside the phone apps only. After the app has been in the background for a
// while Android can leave the page in a half-asleep state — connections the
// phone dropped, timers that never restarted — so it opens but buttons do
// nothing. On return we check the page is alive and, if not (or if it was
// away a long time), reload it. A reload would lose a video still uploading
// or a half-written message, so then we leave the page alone.
const LONG_AWAY_MS = 10 * 60 * 1000;
const CHECK_AFTER_MS = 30 * 1000;
const PROBE_TIMEOUT_MS = 6000;

function somethingUnsaved(): boolean {
  if (hasActiveVideoUpload()) return true;
  const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    "textarea, input[type=text], input[type=search], input[type=tel]"
  );
  for (const field of fields) if (field.value.trim() !== "") return true;
  return false;
}

async function serverAnswers(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    // Any answer at all (even "not signed in") proves the connection works.
    await fetch("/api/notifications/count", { cache: "no-store", signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export default function ResumeGuard() {
  useEffect(() => {
    if (!isNativeApp()) return;
    let leftAt: number | null = null;
    let unlisten: (() => void) | null = null;
    let cancelled = false;

    const left = () => {
      if (leftAt === null) leftAt = Date.now();
    };
    const back = () => {
      if (leftAt === null) return;
      const away = Date.now() - leftAt;
      leftAt = null;
      if (away < CHECK_AFTER_MS) return;
      if (away >= LONG_AWAY_MS) {
        if (!somethingUnsaved()) window.location.reload();
        return;
      }
      void serverAnswers().then((alive) => {
        if (!alive && !somethingUnsaved()) window.location.reload();
      });
    };
    const onVisibility = () => (document.visibilityState === "hidden" ? left() : back());

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", left);
    // MainActivity sends this when the app is shown again, in case the web
    // view itself never reports the change.
    window.addEventListener("findo-native-resume", back);
    void listenForAppState(left, back).then((stop) => {
      if (cancelled) stop();
      else unlisten = stop;
    });
    return () => {
      cancelled = true;
      unlisten?.();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", left);
      window.removeEventListener("findo-native-resume", back);
    };
  }, []);
  return null;
}
