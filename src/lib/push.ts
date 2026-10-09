import webpush from "web-push";
import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { db } from "./db";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./i18n/locales";

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

let cachedKeys: VapidKeys | null = null;

// The VAPID key pair push subscriptions are tied to. NEXT_PUBLIC_VAPID_PUBLIC_KEY
// and VAPID_PRIVATE_KEY in .env.production.local win if set; otherwise the
// server generates a pair once and keeps it in .data/vapid.json (server
// state, like the database — never part of a deploy), so push works with no
// configuration at all. The file is created exclusively, so concurrent
// processes (build workers) can't end up with two different pairs.
export function getVapidKeys(): VapidKeys {
  if (cachedKeys) return cachedKeys;

  const envPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;
  if (envPublic && envPrivate) {
    cachedKeys = { publicKey: envPublic, privateKey: envPrivate };
  } else if (process.env.TOPAMIZ_DB_PATH === ":memory:") {
    // Tests: never touch the real data directory.
    cachedKeys = webpush.generateVAPIDKeys();
  } else {
    const file = path.join(process.cwd(), ".data", "vapid.json");
    try {
      writeFileSync(file, JSON.stringify(webpush.generateVAPIDKeys()), { flag: "wx", mode: 0o600 });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
    }
    cachedKeys = JSON.parse(readFileSync(file, "utf8")) as VapidKeys;
  }

  webpush.setVapidDetails("mailto:info@findo.net.uz", cachedKeys.publicKey, cachedKeys.privateKey);
  return cachedKeys;
}

interface SubscriptionKeys {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function saveSubscription(userId: number, sub: SubscriptionKeys, locale: Locale): void {
  db.prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, locale) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh,
       auth = excluded.auth, locale = excluded.locale`
  ).run(userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth, locale);
}

export function removeSubscription(endpoint: string): void {
  db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  // Notifications sharing a tag replace each other instead of piling up
  // (e.g. one per chat), while still sounding again.
  tag?: string;
}

interface SubscriptionRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  locale: string | null;
}

// Fire-and-forget from every call site — a push failure must never break
// the action it's attached to, so nothing here ever throws. Pass a function
// to word the notification in each subscriber's own language.
export async function sendPushToUser(
  userId: number,
  payload: PushPayload | ((locale: Locale) => PushPayload)
): Promise<void> {
  try {
    const subs = db
      .prepare("SELECT * FROM push_subscriptions WHERE user_id = ?")
      .all(userId) as SubscriptionRow[];
    if (subs.length === 0) return;
    getVapidKeys();

    await Promise.all(
      subs.map(async (sub) => {
        const locale = isLocale(sub.locale) ? sub.locale : DEFAULT_LOCALE;
        const data = typeof payload === "function" ? payload(locale) : payload;
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(data),
            { TTL: 24 * 60 * 60, urgency: "high" }
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
