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

// Every step below can hang forever on some phones instead of failing: the
// permission prompt on old browsers that only support the callback form,
// a service worker that never activates, and above all pushManager.subscribe
// on phones without (working) Google Play services — Huawei, some Xiaomi
// and Chinese-market phones — where it simply never answers. Each step gets
// a deadline, and a failure says which step it was.
export type PushFailure = "permission-timeout" | "worker-timeout" | "push-service" | "server" | "denied" | "unknown";

export class PushError extends Error {
  constructor(
    public code: PushFailure,
    cause?: unknown
  ) {
    super(`push failed: ${code}${cause instanceof Error ? ` (${cause.name}: ${cause.message})` : ""}`);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, code: PushFailure): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new PushError(code)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function fetchWithTimeout(input: string, init: RequestInit = {}, ms = 15_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    throw new PushError("server", err);
  } finally {
    clearTimeout(timer);
  }
}

// Notification.requestPermission returns a promise in current browsers but
// only takes a callback in older Safari and Samsung Internet — support both.
// The visitor may take a while to answer the prompt, hence the long deadline.
export function requestPermission(): Promise<NotificationPermission> {
  const asked = new Promise<NotificationPermission>((resolve, reject) => {
    try {
      const result = Notification.requestPermission(resolve);
      if (result && typeof result.then === "function") result.then(resolve, reject);
    } catch (err) {
      reject(err);
    }
  });
  return withTimeout(asked, 60_000, "permission-timeout");
}

export async function getRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js");
}

// Push needs an *active* worker; register() can resolve while it's still
// installing, and on some phones it never gets further.
async function activeRegistration(): Promise<ServiceWorkerRegistration> {
  await withTimeout(getRegistration(), 15_000, "worker-timeout");
  return withTimeout(navigator.serviceWorker.ready, 15_000, "worker-timeout");
}

export async function isSubscribed(): Promise<boolean> {
  const reg = await activeRegistration();
  return !!(await withTimeout(reg.pushManager.getSubscription(), 8_000, "push-service"));
}

// Subscribes this browser (permission must already be granted) and tells
// the server about it. Re-subscribes if an older subscription was made with
// a different server key, and always re-sends the subscription, so the
// server also learns the current language and recovers subscriptions it
// dropped.
export async function ensureSubscribed(): Promise<void> {
  const keyRes = await fetchWithTimeout("/api/push/key");
  if (!keyRes.ok) throw new PushError("server");
  const { key } = (await keyRes.json()) as { key: string };
  const serverKey = urlBase64ToUint8Array(key);

  const reg = await activeRegistration();
  let sub = await withTimeout(reg.pushManager.getSubscription(), 8_000, "push-service");
  if (sub && !sameKey(sub.options.applicationServerKey, serverKey)) {
    await withTimeout(sub.unsubscribe(), 8_000, "push-service").catch(() => {});
    sub = null;
  }
  if (!sub) {
    try {
      sub = await withTimeout(
        reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: serverKey as BufferSource }),
        15_000,
        "push-service"
      );
    } catch (err) {
      if (err instanceof PushError) throw err;
      // NotAllowedError: permission was revoked in between. Anything else
      // ("push service error", AbortError) is the phone's push service.
      throw new PushError((err as Error)?.name === "NotAllowedError" ? "denied" : "push-service", err);
    }
  }

  const res = await fetchWithTimeout("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!res.ok) throw new PushError("server");
}

// Runs on every page load: re-sends an existing subscription (and redoes it
// if the server key changed). Never creates one — only the toggle does.
export async function refreshSubscription(): Promise<void> {
  if (Notification.permission !== "granted") return;
  const reg = await activeRegistration();
  const sub = await withTimeout(reg.pushManager.getSubscription(), 8_000, "push-service");
  if (sub) await ensureSubscribed();
}

// Turning off must always succeed from the visitor's point of view: if the
// browser hangs, the server still forgets the subscription.
export async function disablePush(): Promise<void> {
  const reg = await activeRegistration();
  const sub = await withTimeout(reg.pushManager.getSubscription(), 8_000, "push-service");
  if (!sub) return;
  await fetchWithTimeout("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  await withTimeout(sub.unsubscribe(), 8_000, "push-service").catch(() => {});
}

export function pushFailureCode(err: unknown): PushFailure {
  return err instanceof PushError ? err.code : "unknown";
}
