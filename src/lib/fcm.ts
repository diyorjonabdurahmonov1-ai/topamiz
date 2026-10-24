import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { db } from "./db";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./i18n/locales";

// Push to the Android app (mobile/android) through Firebase Cloud Messaging.
// Like the iPhone app (apns.ts), the app registers itself and hands the site
// its device token (src/lib/native-push.ts, /api/push/fcm); sendPushToUser
// (push.ts) then sends to those tokens too, via the FCM HTTP v1 API.
//
// Needs, in .env.production.local, the Firebase project's service account
// (Firebase console → Project settings → Service accounts → "Generate new
// private key"), either as a file path or the JSON itself on one line:
//   FCM_SERVICE_ACCOUNT_FILE=/var/www/topamiz/.data/firebase-service-account.json
//   FCM_SERVICE_ACCOUNT={"type":"service_account",...}
// Without it, Android pushes are skipped and everything else works.

interface ServiceAccount {
  projectId: string;
  clientEmail: string;
  key: crypto.KeyObject;
  tokenUri: string;
}

let cachedAccount: ServiceAccount | null | undefined;

function account(): ServiceAccount | null {
  if (cachedAccount !== undefined) return cachedAccount;
  let raw = process.env.FCM_SERVICE_ACCOUNT?.trim();
  if (!raw && process.env.FCM_SERVICE_ACCOUNT_FILE) {
    try {
      raw = readFileSync(process.env.FCM_SERVICE_ACCOUNT_FILE, "utf8");
    } catch {
      raw = undefined;
    }
  }
  if (!raw) return (cachedAccount = null);
  try {
    const json = JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string; token_uri?: string };
    if (!json.project_id || !json.client_email || !json.private_key) throw new Error("incomplete service account");
    cachedAccount = {
      projectId: json.project_id,
      clientEmail: json.client_email,
      key: crypto.createPrivateKey(json.private_key),
      tokenUri: json.token_uri || "https://oauth2.googleapis.com/token",
    };
  } catch (err) {
    console.error("[fcm] FCM_SERVICE_ACCOUNT isn't a valid service account:", err);
    cachedAccount = null;
  }
  return cachedAccount;
}

export function isFcmConfigured(): boolean {
  return account() !== null;
}

// The signed request for an access token (RS256 JWT, valid an hour).
export function fcmAssertion(sa: ServiceAccount, now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.tokenUri,
    iat,
    exp: iat + 3600,
  })}`;
  const signature = crypto.sign("sha256", Buffer.from(unsigned), sa.key);
  return `${unsigned}.${signature.toString("base64url")}`;
}

export interface FcmMessage {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export function fcmBody(token: string, message: FcmMessage): string {
  return JSON.stringify({
    message: {
      token,
      notification: { title: message.title, body: message.body },
      // Tapping the notification opens this page (native-push.ts).
      data: { url: message.url ?? "/" },
      android: {
        priority: "high",
        // Same tag replaces the earlier notification (one per chat).
        notification: { sound: "default", ...(message.tag ? { tag: message.tag } : {}) },
      },
    },
  });
}

type Transport = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  status: number;
  json: () => Promise<unknown>;
}>;

let transport: Transport = (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });

// Tests replace the network with a fake.
export function setFcmTransportForTests(fake: Transport | null, fakeAccount?: ServiceAccount | null): void {
  transport = fake ?? ((url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(15_000) }));
  cachedAccount = fakeAccount === undefined ? undefined : fakeAccount;
  cachedAccessToken = null;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) return cachedAccessToken.token;
  const res = await transport(sa.tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: fcmAssertion(sa),
    }).toString(),
  });
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (res.status !== 200 || !data.access_token) throw new Error(`[fcm] token request failed: ${res.status}`);
  cachedAccessToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cachedAccessToken.token;
}

export function saveFcmToken(userId: number, token: string, locale: Locale): void {
  db.prepare(
    `INSERT INTO fcm_tokens (token, user_id, locale) VALUES (?, ?, ?)
     ON CONFLICT(token) DO UPDATE SET user_id = excluded.user_id, locale = excluded.locale, updated_at = datetime('now')`
  ).run(token, userId, locale);
}

export function removeFcmToken(token: string): void {
  db.prepare("DELETE FROM fcm_tokens WHERE token = ?").run(token);
}

// FCM registration tokens are long strings of letters, digits, "-", "_"
// and ":" — the exact format isn't documented, so only the shape is checked.
export function isFcmToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_:\-]{32,4096}$/.test(value);
}

// Only "this token is gone" — not INVALID_ARGUMENT, which can just as well
// mean a mistake in our own message, and would wipe every phone's token.
function isDeadToken(status: number, error: unknown): boolean {
  if (status === 404) return true;
  const details = (error as { error?: { details?: { errorCode?: string }[] } } | null)?.error?.details ?? [];
  return details.some((d) => d.errorCode === "UNREGISTERED");
}

// Never throws — a failed notification must not break the action it belongs to.
export async function sendFcmToUser(
  userId: number,
  message: FcmMessage | ((locale: Locale) => FcmMessage)
): Promise<void> {
  try {
    const sa = account();
    if (!sa) return;
    const rows = db.prepare("SELECT token, locale FROM fcm_tokens WHERE user_id = ?").all(userId) as {
      token: string;
      locale: string | null;
    }[];
    if (rows.length === 0) return;
    const bearer = await accessToken(sa);
    await Promise.all(
      rows.map(async (row) => {
        const locale = isLocale(row.locale) ? row.locale : DEFAULT_LOCALE;
        const msg = typeof message === "function" ? message(locale) : message;
        try {
          const res = await transport(`https://fcm.googleapis.com/v1/projects/${sa.projectId}/messages:send`, {
            method: "POST",
            headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
            body: fcmBody(row.token, msg),
          });
          if (res.status !== 200 && isDeadToken(res.status, await res.json().catch(() => null))) {
            removeFcmToken(row.token); // app uninstalled, or the token is no longer valid
          }
        } catch {
          // Network trouble: try again with the next notification.
        }
      })
    );
  } catch {
    // Best-effort only.
  }
}
