import crypto from "node:crypto";
import http2 from "node:http2";
import { readFileSync } from "node:fs";
import { db } from "./db";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./i18n/locales";

// Push to the iPhone app (ios-app/) through Apple Push Notification service.
// Web push doesn't exist inside an app's web view, so the app registers with
// APNs itself and hands the device token to the site (src/lib/native-push.ts,
// /api/push/apns); sendPushToUser (push.ts) then sends to those tokens too.
//
// Needs, in .env.production.local, a key from developer.apple.com → Keys
// (with "Apple Push Notifications service" ticked):
//   APNS_KEY_ID   — the key's 10-character id
//   APNS_TEAM_ID  — the developer account's Team ID
//   APNS_KEY      — the .p8 file's contents (newlines may be written as \n),
//                   or APNS_KEY_FILE — a path to the .p8 file
//   APNS_TOPIC    — the app's bundle id, defaults to uz.net.findo.app
// Without them, iPhone pushes are skipped and everything else works.

const HOSTS = {
  production: "https://api.push.apple.com",
  sandbox: "https://api.sandbox.push.apple.com",
} as const;
type ApnsEnv = keyof typeof HOSTS;

interface ApnsConfig {
  keyId: string;
  teamId: string;
  key: crypto.KeyObject;
  topic: string;
}

let cachedConfig: ApnsConfig | null | undefined;

function config(): ApnsConfig | null {
  if (cachedConfig !== undefined) return cachedConfig;
  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  let pem = process.env.APNS_KEY?.replace(/\\n/g, "\n").trim();
  if (!pem && process.env.APNS_KEY_FILE) {
    try {
      pem = readFileSync(process.env.APNS_KEY_FILE, "utf8");
    } catch {
      pem = undefined;
    }
  }
  if (!keyId || !teamId || !pem) return (cachedConfig = null);
  try {
    cachedConfig = {
      keyId,
      teamId,
      key: crypto.createPrivateKey(pem),
      topic: process.env.APNS_TOPIC?.trim() || "uz.net.findo.app",
    };
  } catch (err) {
    console.error("[apns] APNS_KEY isn't a valid .p8 key:", err);
    cachedConfig = null;
  }
  return cachedConfig;
}

export function isApnsConfigured(): boolean {
  return config() !== null;
}

// The provider token: an ES256 JWT, which Apple wants reused for up to an
// hour and refreshed no more often than every 20 minutes.
let cachedJwt: { token: string; issuedAt: number } | null = null;

export function apnsJwt(cfg: ApnsConfig, now = Date.now()): string {
  if (cachedJwt && now - cachedJwt.issuedAt < 40 * 60 * 1000) return cachedJwt.token;
  const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${b64({ alg: "ES256", kid: cfg.keyId })}.${b64({ iss: cfg.teamId, iat: Math.floor(now / 1000) })}`;
  const signature = crypto.sign("sha256", Buffer.from(unsigned), { key: cfg.key, dsaEncoding: "ieee-p1363" });
  cachedJwt = { token: `${unsigned}.${signature.toString("base64url")}`, issuedAt: now };
  return cachedJwt.token;
}

export interface ApnsMessage {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export function apnsBody(message: ApnsMessage): string {
  return JSON.stringify({
    aps: {
      alert: { title: message.title, body: message.body },
      sound: "default",
      // Groups a chat's messages together in Notification Center.
      ...(message.tag ? { "thread-id": message.tag } : {}),
    },
    url: message.url ?? "/",
  });
}

type Transport = (
  env: ApnsEnv,
  deviceToken: string,
  headers: Record<string, string>,
  body: string
) => Promise<{ status: number; reason?: string }>;

const sessions = new Map<ApnsEnv, http2.ClientHttp2Session>();

function session(env: ApnsEnv): http2.ClientHttp2Session {
  const existing = sessions.get(env);
  if (existing && !existing.closed && !existing.destroyed) return existing;
  const created = http2.connect(HOSTS[env]);
  created.on("error", () => sessions.delete(env));
  created.on("close", () => sessions.delete(env));
  // An idle connection shouldn't keep the process (or a test run) alive.
  created.unref();
  sessions.set(env, created);
  return created;
}

const http2Transport: Transport = (env, deviceToken, headers, body) =>
  new Promise((resolve, reject) => {
    const req = session(env).request({ ":method": "POST", ":path": `/3/device/${deviceToken}`, ...headers });
    let status = 0;
    let data = "";
    req.setEncoding("utf8");
    req.setTimeout(15_000, () => req.close(http2.constants.NGHTTP2_CANCEL));
    req.on("response", (h) => (status = Number(h[":status"])));
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      let reason: string | undefined;
      try {
        reason = data ? (JSON.parse(data) as { reason?: string }).reason : undefined;
      } catch {
        reason = undefined;
      }
      resolve({ status, reason });
    });
    req.on("error", reject);
    req.end(body);
  });

let transport: Transport = http2Transport;

// Tests replace the network with a fake.
export function setApnsTransportForTests(fake: Transport | null, fakeConfig?: ApnsConfig | null): void {
  transport = fake ?? http2Transport;
  cachedConfig = fakeConfig === undefined ? undefined : fakeConfig;
  cachedJwt = null;
}

export function saveApnsToken(userId: number, token: string, locale: Locale): void {
  db.prepare(
    `INSERT INTO apns_tokens (token, user_id, locale) VALUES (?, ?, ?)
     ON CONFLICT(token) DO UPDATE SET user_id = excluded.user_id, locale = excluded.locale, updated_at = datetime('now')`
  ).run(token, userId, locale);
}

export function removeApnsToken(token: string): void {
  db.prepare("DELETE FROM apns_tokens WHERE token = ?").run(token);
}

// A device token is hex, 64 characters today; Apple says not to rely on the
// length, so anything reasonable is taken.
export function isApnsToken(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-fA-F]{32,400}$/.test(value);
}

interface TokenRow {
  token: string;
  locale: string | null;
  env: ApnsEnv;
}

// Never throws — like web push, a failed notification must not break the
// action it belongs to.
export async function sendApnsToUser(
  userId: number,
  message: ApnsMessage | ((locale: Locale) => ApnsMessage)
): Promise<void> {
  try {
    const cfg = config();
    if (!cfg) return;
    const rows = db.prepare("SELECT token, locale, env FROM apns_tokens WHERE user_id = ?").all(userId) as TokenRow[];
    if (rows.length === 0) return;

    await Promise.all(
      rows.map(async (row) => {
        const locale = isLocale(row.locale) ? row.locale : DEFAULT_LOCALE;
        const msg = typeof message === "function" ? message(locale) : message;
        const headers: Record<string, string> = {
          authorization: `bearer ${apnsJwt(cfg)}`,
          "apns-topic": cfg.topic,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "apns-expiration": String(Math.floor(Date.now() / 1000) + 24 * 60 * 60),
          // Same tag replaces the earlier notification (one per chat).
          ...(msg.tag ? { "apns-collapse-id": msg.tag.slice(0, 64) } : {}),
        };
        const body = apnsBody(msg);
        try {
          let res = await transport(row.env, row.token, headers, body);
          // A build run straight from Xcode gets sandbox tokens, which the
          // production service rejects as BadDeviceToken: try there once, and
          // remember which one the token belongs to.
          if (res.status === 400 && res.reason === "BadDeviceToken" && row.env === "production") {
            res = await transport("sandbox", row.token, headers, body);
            if (res.status === 200) {
              db.prepare("UPDATE apns_tokens SET env = 'sandbox' WHERE token = ?").run(row.token);
            }
          }
          if (res.status === 410 || (res.status === 400 && res.reason === "BadDeviceToken")) {
            removeApnsToken(row.token); // app deleted, or the token is no longer valid
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
