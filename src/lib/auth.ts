import { cookies } from "next/headers";
import crypto from "node:crypto";
import { db } from "./db";

const SESSION_COOKIE = "topamiz_session";
const SESSION_DAYS = 30;

export interface AuthUser {
  id: number;
  phone: string;
  name: string;
  bio: string;
  avatarColor: string;
  isPremium: boolean;
  createdAt: string;
}

interface UserRow {
  id: number;
  phone: string;
  password_hash: string;
  name: string;
  bio: string;
  avatar_color: string;
  is_premium: number;
  created_at: string;
}

function rowToUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    bio: row.bio,
    avatarColor: row.avatar_color,
    isPremium: !!row.is_premium,
    createdAt: row.created_at,
  };
}

const AVATAR_COLORS = [
  "#6366f1", "#22d3ee", "#a855f7", "#f59e0b", "#ec4899", "#16a34a", "#0ea5e9",
];
export function pickAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function hashWithSalt(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function createPasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${hashWithSalt(password, salt)}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = hashWithSalt(password, salt);
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  return digits.startsWith("998") ? `+${digits}` : `+998${digits.replace(/^0+/, "")}`;
}

export function getUserByPhone(phone: string): AuthUser | null {
  const row = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export function getUserPasswordHash(phone: string): string | null {
  const row = db
    .prepare("SELECT password_hash FROM users WHERE phone = ?")
    .get(phone) as { password_hash: string } | undefined;
  return row?.password_hash ?? null;
}

export function getUserById(id: number): AuthUser | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export function createUser(phone: string, password: string, name: string): AuthUser {
  const passwordHash = createPasswordHash(password);
  const avatarColor = pickAvatarColor(phone);
  const info = db
    .prepare(
      "INSERT INTO users (phone, password_hash, name, avatar_color) VALUES (?, ?, ?, ?)"
    )
    .run(phone, passwordHash, name, avatarColor);
  const user = getUserById(Number(info.lastInsertRowid));
  if (!user) throw new Error("Foydalanuvchi yaratilmadi");
  return user;
}

export function createSession(userId: number): { token: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    expiresAt.toISOString()
  );
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    )
    .get(token) as UserRow | undefined;

  return row ? rowToUser(row) : null;
}
