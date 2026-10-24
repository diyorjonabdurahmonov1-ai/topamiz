// Small bits of the phone apps (mobile/) the site uses when it runs inside
// one. Plugin code is only loaded there; in a browser these do nothing.

import { isNativeApp } from "./native-push";

// Wrapped for the same reason as in native-push.ts: a plugin is a proxy, and
// resolving a promise with it calls its .then() on the native side.
async function loadApp() {
  const { App } = await import("@capacitor/app");
  return { app: App };
}

async function loadShare() {
  const { Share } = await import("@capacitor/share");
  return { share: Share };
}

// A findo.net.uz link opened from elsewhere (Telegram, SMS) starts or wakes
// the app (App Links / universal links), which loads the home page — this
// hands over the link's path so the site can go there.
export async function listenForAppLinks(onPath: (path: string) => void): Promise<() => void> {
  if (!isNativeApp()) return () => {};
  const { app } = await loadApp();
  const handle = await app.addListener("appUrlOpen", ({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "findo.net.uz" || parsed.hostname.endsWith(".findo.net.uz")) {
        onPath(`${parsed.pathname}${parsed.search}${parsed.hash}`);
      }
    } catch {
      // Not a URL we understand: stay where we are.
    }
  });
  return () => void handle.remove();
}

// The phone's own share sheet. false when it couldn't be shown (or the
// person backed out), so the caller can fall back to copying the link.
export async function nativeShare(data: { title: string; url: string }): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { share } = await loadShare();
    await share.share({ title: data.title, url: data.url, dialogTitle: data.title });
    return true;
  } catch {
    return false;
  }
}
