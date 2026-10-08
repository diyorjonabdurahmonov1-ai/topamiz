import crypto from "node:crypto";
import { db } from "./db";

const CODE_TTL_MS = 5 * 60 * 1000;
export const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

// Accepts what people actually type — "90 123 45 67", "+998 90 123-45-67",
// "998901234567" — and returns +998XXXXXXXXX, or null if it isn't an
// Uzbek mobile number.
export function normalizeUzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("998") ? digits.slice(3) : digits;
  return /^\d{9}$/.test(local) ? `+998${local}` : null;
}

function hashCode(phone: string, code: string): string {
  return crypto.createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

interface CodeRow {
  code_hash: string;
  expires_at: number;
  sent_at: number;
  attempts: number;
}

// Returns the new code, or how long to wait if one was sent too recently.
export function issueLoginCode(phone: string): { code: string } | { retryAfterSeconds: number } {
  const now = Date.now();
  const existing = db.prepare("SELECT * FROM phone_codes WHERE phone = ?").get(phone) as CodeRow | undefined;
  if (existing) {
    const wait = Math.ceil((existing.sent_at + RESEND_COOLDOWN_SECONDS * 1000 - now) / 1000);
    if (wait > 0) return { retryAfterSeconds: wait };
  }
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  db.prepare(
    `INSERT INTO phone_codes (phone, code_hash, expires_at, sent_at, attempts) VALUES (?, ?, ?, ?, 0)
     ON CONFLICT(phone) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at,
       sent_at = excluded.sent_at, attempts = 0`
  ).run(phone, hashCode(phone, code), now + CODE_TTL_MS, now);
  return { code };
}

// A failed SMS send shouldn't block the poster from trying again at once.
export function discardLoginCode(phone: string) {
  db.prepare("DELETE FROM phone_codes WHERE phone = ?").run(phone);
}

export function checkLoginCode(phone: string, code: string): "ok" | "wrong" | "expired" | "too-many" {
  const row = db.prepare("SELECT * FROM phone_codes WHERE phone = ?").get(phone) as CodeRow | undefined;
  if (!row || Date.now() > row.expires_at) return "expired";
  if (row.attempts >= MAX_ATTEMPTS) return "too-many";

  const given = Buffer.from(hashCode(phone, code.trim()));
  const expected = Buffer.from(row.code_hash);
  if (given.length === expected.length && crypto.timingSafeEqual(given, expected)) {
    discardLoginCode(phone);
    return "ok";
  }
  db.prepare("UPDATE phone_codes SET attempts = attempts + 1 WHERE phone = ?").run(phone);
  return row.attempts + 1 >= MAX_ATTEMPTS ? "too-many" : "wrong";
}
