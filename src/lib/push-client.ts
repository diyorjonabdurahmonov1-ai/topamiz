// Browser side of web push, shared by the profile toggle and the site-wide
// NotificationCenter. Everything here is safe to call repeatedly.

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Why push may be missing: iPhones only support it for a site added to the
// Home Screen (iOS 16.4+), and in-app browsers (Telegram, Instagram…) and
// some others don't support it at all.
export type PushAvailability = "supported" | "ios-install" | "unsupported";

export function pushAvailability(): PushAvailability {
  if (pushSupported()) return "supported";
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone ? "ios-install" : "unsupported";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function sameKey(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a) return false;
  const view = new Uint8Array(a);
  return view.length === b.length && view.every((byte, i) => byte === b[i]);
}

export async function getRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js");
}

export async function isSubscribed(): Promise<boolean> {
  const reg = await getRegistration();
  return !!(await reg.pushManager.getSubscription());
}

// Subscribes this browser (permission must already be granted) and tells
// the server about it. Re-subscribes if an older subscription was made with
// a different server key, and always re-sends the subscription, so the
// server also learns the current language and recovers subscriptions it
// dropped.
export async function ensureSubscribed(): Promise<void> {
  const keyRes = await fetch("/api/push/key");
  if (!keyRes.ok) throw new Error("push key unavailable");
  const { key } = (await keyRes.json()) as { key: string };
  const serverKey = urlBase64ToUint8Array(key);

  const reg = await getRegistration();
  let sub = await reg.pushManager.getSubscription();
  if (sub && !sameKey(sub.options.applicationServerKey, serverKey)) {
    await sub.unsubscribe();
    sub = null;
  }
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: serverKey as BufferSource,
    });
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!res.ok) throw new Error("subscribe failed");
}

export async function disablePush(): Promise<void> {
  const reg = await getRegistration();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  await sub.unsubscribe();
}
