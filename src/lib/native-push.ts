// Push inside the iPhone app (ios-app/): the site runs in the app's web view,
// where web push doesn't exist, so it asks the app's push plugin to register
// with Apple and hands the device token to the server (/api/push/apns,
// lib/apns.ts). Outside the app none of this runs — and the plugin's code is
// only loaded inside it.

import { PushError } from "./push-client";

const TOKEN_KEY = "findo-apns-token";

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

// Wrapped: the plugin is a proxy, and resolving a promise with it directly
// makes the promise call its .then() — which the proxy forwards to native
// code that doesn't exist.
async function loadPlugin() {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  return { push: PushNotifications };
}

function storedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Without storage the token is just sent again next launch.
  }
}

// register() answers through events, not its promise: wait for either.
async function registerForToken(): Promise<string> {
  const { push } = await loadPlugin();
  return new Promise<string>((resolve, reject) => {
    const handles: Promise<{ remove: () => Promise<void> }>[] = [];
    const done = () => handles.forEach((h) => h.then((x) => x.remove()).catch(() => {}));
    const timer = setTimeout(() => {
      done();
      reject(new PushError("push-service"));
    }, 20_000);
    handles.push(
      push.addListener("registration", (token) => {
        clearTimeout(timer);
        done();
        resolve(token.value);
      })
    );
    handles.push(
      push.addListener("registrationError", (err) => {
        clearTimeout(timer);
        done();
        reject(new PushError("push-service", new Error(err.error)));
      })
    );
    push.register().catch((err) => {
      clearTimeout(timer);
      done();
      reject(new PushError("push-service", err));
    });
  });
}

async function sendToken(token: string): Promise<void> {
  const res = await fetch("/api/push/apns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  }).catch((err) => {
    throw new PushError("server", err);
  });
  if (!res.ok) throw new PushError("server");
  storeToken(token);
}

export async function nativePushEnabled(): Promise<boolean> {
  const { push } = await loadPlugin();
  const { receive } = await push.checkPermissions();
  return receive === "granted" && !!storedToken();
}

export async function nativePushDenied(): Promise<boolean> {
  const { push } = await loadPlugin();
  return (await push.checkPermissions()).receive === "denied";
}

// The button: iOS asks once; after a "no" only the phone's Settings can
// turn it back on.
export async function enableNativePush(): Promise<void> {
  const { push } = await loadPlugin();
  const { receive } = await push.requestPermissions();
  if (receive !== "granted") throw new PushError("denied");
  await sendToken(await registerForToken());
}

export async function disableNativePush(): Promise<void> {
  const token = storedToken();
  storeToken(null);
  if (!token) return;
  await fetch("/api/push/apns", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  }).catch(() => {});
}

// Each launch: re-send the token (it can change, and the server learns the
// current language) — only for someone who turned notifications on.
export async function refreshNativePush(): Promise<void> {
  if (!storedToken()) return;
  const { push } = await loadPlugin();
  if ((await push.checkPermissions()).receive !== "granted") return;
  await sendToken(await registerForToken());
}

export interface NativePushMessage {
  title: string;
  body: string;
  url: string;
}

// `onReceived`: a push that arrived while the app is open (the site shows its
// own chime and toast, as for web push). `onOpened`: the user tapped one.
export async function listenForNativePushes(handlers: {
  onReceived: (message: NativePushMessage) => void;
  onOpened: (url: string) => void;
}): Promise<() => void> {
  const { push } = await loadPlugin();
  const received = await push.addListener("pushNotificationReceived", (n) => {
    handlers.onReceived({
      title: n.title || "Findo",
      body: n.body || "",
      url: typeof n.data?.url === "string" ? n.data.url : "/bildirishnomalar",
    });
  });
  const opened = await push.addListener("pushNotificationActionPerformed", (action) => {
    const url = action.notification.data?.url;
    handlers.onOpened(typeof url === "string" && url.startsWith("/") ? url : "/bildirishnomalar");
  });
  return () => {
    void received.remove();
    void opened.remove();
  };
}
