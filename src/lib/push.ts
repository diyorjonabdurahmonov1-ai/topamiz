import webpush from "web-push";
import { db } from "./db";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:info@findo.net.uz", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Without a real VAPID key pair configured (see AGENTS.md-documented env
// vars), push is silently a no-op instead of throwing — same "degrade
// gracefully" approach as the Google OAuth env vars.
export function isPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

interface SubscriptionKeys {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function saveSubscription(userId: number, sub: SubscriptionKeys): void {
  db.prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`
  ).run(userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth);
}

export function removeSubscription(endpoint: string): void {
  db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

interface SubscriptionRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Fire-and-forget from every call site — a push failure (or this being
// unconfigured) must never break the message send it's attached to, so
// nothing here ever throws.
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  if (!isPushConfigured()) return;

  try {
    const subs = db
      .prepare("SELECT * FROM push_subscriptions WHERE user_id = ?")
      .all(userId) as SubscriptionRow[];
    if (subs.length === 0) return;

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload)
          );
        } catch (err) {
          // 404/410 means the browser dropped this subscription (site data
          // cleared, app uninstalled, etc.) — stop trying to reach it.
          const statusCode = (err as { statusCode?: number } | null)?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(sub.id);
          }
        }
      })
    );
  } catch {
    // Best-effort only — swallow anything unexpected (e.g. a DB hiccup).
  }
}
