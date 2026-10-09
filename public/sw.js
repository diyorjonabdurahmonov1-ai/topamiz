// Minimal service worker whose only job is showing push notifications and
// opening the right page when one is clicked — no offline caching, so it
// can't go stale and serve outdated content.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Someone looking at the site right now gets an in-page chime and
      // toast (NotificationCenter) instead of a system notification.
      const visible = clientList.find((c) => c.visibilityState === "visible" && c.focused);
      if (visible) {
        visible.postMessage({ type: "findo-push", payload: data });
        return;
      }
      return self.registration.showNotification(data.title || "Findo", {
        body: data.body || "",
        icon: "/icon-192.png",
        // Android draws the status-bar badge as a silhouette, so it has to
        // be white-on-transparent rather than the full-colour app icon.
        badge: "/notification-badge.png",
        tag: data.tag,
        renotify: !!data.tag,
        vibrate: [200, 100, 200],
        silent: false,
        data: { url: data.url || "/" },
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(
    (event.notification.data && event.notification.data.url) || "/",
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      const existing = clientList.find((c) => "navigate" in c);
      if (existing) {
        await existing.focus();
        return existing.navigate(url);
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
