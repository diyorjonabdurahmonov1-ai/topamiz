import crypto from "node:crypto";
import { db } from "./db";
import { CODE_LENGTH } from "./verification-code";

const CODE_TTL_MS = 5 * 60 * 1000;
export const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 100;

export function passwordProblem(password: unknown): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Parol kamida ${MIN_PASSWORD_LENGTH} belgidan iborat bo'lishi kerak.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) return "Parol juda uzun.";
  if (!/[A-Za-z\u0400-\u04FF]/.test(password) || !/\d/.test(password)) {
    return "Parolda kamida bitta harf va bitta raqam bo'lishi kerak.";
  }
  return null;
}

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

// Codes are scoped to what they're for, so a sign-up code can't be used to
// reset a password and vice versa.
export type CodePurpose = "register" | "reset";

// Returns the new code, or how long to wait if one was sent too recently.
export function issueCode(purpose: CodePurpose, phone: string): { code: string } | { retryAfterSeconds: number } {
  const key = `${purpose}:${phone}`;
  const now = Date.now();
  const existing = db.prepare("SELECT * FROM phone_codes WHERE phone = ?").get(key) as CodeRow | undefined;
  if (existing) {
    const wait = Math.ceil((existing.sent_at + RESEND_COOLDOWN_SECONDS * 1000 - now) / 1000);
    if (wait > 0) return { retryAfterSeconds: wait };
  }
  const code = String(crypto.randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
  db.prepare(
    `INSERT INTO phone_codes (phone, code_hash, expires_at, sent_at, attempts) VALUES (?, ?, ?, ?, 0)
     ON CONFLICT(phone) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at,
       sent_at = excluded.sent_at, attempts = 0`
  ).run(key, hashCode(key, code), now + CODE_TTL_MS, now);
  return { code };
}

// A failed SMS send shouldn't block the poster from trying again at once.
export function discardCode(purpose: CodePurpose, phone: string) {
  db.prepare("DELETE FROM phone_codes WHERE phone = ?").run(`${purpose}:${phone}`);
}

export function checkCode(
  purpose: CodePurpose,
  phone: string,
  code: string
): "ok" | "wrong" | "expired" | "too-many" {
  const key = `${purpose}:${phone}`;
  const row = db.prepare("SELECT * FROM phone_codes WHERE phone = ?").get(key) as CodeRow | undefined;
  if (!row || Date.now() > row.expires_at) return "expired";
  if (row.attempts >= MAX_ATTEMPTS) return "too-many";

  const given = Buffer.from(hashCode(key, code.trim()));
  const expected = Buffer.from(row.code_hash);
  if (given.length === expected.length && crypto.timingSafeEqual(given, expected)) {
    discardCode(purpose, phone);
    return "ok";
  }
  db.prepare("UPDATE phone_codes SET attempts = attempts + 1 WHERE phone = ?").run(key);
  return row.attempts + 1 >= MAX_ATTEMPTS ? "too-many" : "wrong";
}
