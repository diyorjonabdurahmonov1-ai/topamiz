import { cookies } from "next/headers";
import crypto from "node:crypto";
import { db } from "./db";

const SESSION_COOKIE = "topamiz_session";
const SESSION_DAYS = 30;
export const MAX_NAME_LENGTH = 80;
export const MAX_BIO_LENGTH = 280;

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  bio: string;
  avatarColor: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface UserRow {
  id: number;
  email: string | null;
  phone: string | null;
  name: string;
  bio: string;
  avatar_color: string;
  avatar_url: string | null;
  blocked_at: string | null;
  created_at: string;
}

function rowToUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    // A handful of accounts created before Google sign-in have no email on
    // file — fall back to their old phone so the field is never blank.
    email: row.email ?? row.phone ?? "",
    name: row.name,
    bio: row.bio,
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url,
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

export function getUserById(id: number): AuthUser | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export function getUserByGoogleId(googleId: string): AuthUser | null {
  const row = db
    .prepare("SELECT * FROM users WHERE google_id = ?")
    .get(googleId) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export function getUserByEmail(email: string): AuthUser | null {
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export function findOrCreateGoogleUser(params: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}): AuthUser {
  const existingByGoogleId = getUserByGoogleId(params.googleId);
  if (existingByGoogleId) return existingByGoogleId;

  // An account with this email but no linked Google id shouldn't normally
  // happen now that Google is the only sign-in path, but link it instead of
  // erroring on the email UNIQUE constraint if it ever does.
  const existingByEmail = getUserByEmail(params.email);
  if (existingByEmail) {
    db.prepare("UPDATE users SET google_id = ? WHERE id = ?").run(
      params.googleId,
      existingByEmail.id
    );
    return existingByEmail;
  }

  const name = params.name.trim().slice(0, MAX_NAME_LENGTH) || params.email.split("@")[0];
  const avatarColor = pickAvatarColor(params.email);
  const info = db
    .prepare(
      `INSERT INTO users (google_id, email, name, avatar_color, avatar_url)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(params.googleId, params.email, name, avatarColor, params.avatarUrl ?? null);
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

export function isUserBlocked(id: number): boolean {
  const row = db.prepare("SELECT blocked_at FROM users WHERE id = ?").get(id) as
    | { blocked_at: string | null }
    | undefined;
  return !!row?.blocked_at;
}

export function isAdmin(user: Pick<AuthUser, "email"> | null): boolean {
  if (!user?.email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(user.email.toLowerCase());
}

// The admin's messages should read as coming from the platform itself, not
// their personal Google account — reserved so no regular user can impersonate it.
export const BRAND_NAME = "Findo";
const BRAND_AVATAR_COLOR = "#6366f1";

export function isReservedName(name: string): boolean {
  return name.trim().toLowerCase().replace(/\s+/g, "") === BRAND_NAME.toLowerCase();
}

export function displayIdentity(
  user: Pick<AuthUser, "email" | "name" | "avatarColor" | "avatarUrl">
): { name: string; avatarColor: string; avatarUrl: string | null } {
  if (isAdmin(user)) {
    return { name: BRAND_NAME, avatarColor: BRAND_AVATAR_COLOR, avatarUrl: null };
  }
  return { name: user.name, avatarColor: user.avatarColor, avatarUrl: user.avatarUrl };
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

  if (!row) return null;

  if (row.blocked_at) {
    // Blocked mid-session — end it now instead of letting a stale cookie
    // keep working until it naturally expires.
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }

  // Powers the admin panel's "online now" count — throttled to at most
  // once a minute per user so this doesn't add a write to every request.
  db.prepare(
    `UPDATE users SET last_seen_at = datetime('now')
     WHERE id = ? AND (last_seen_at IS NULL OR last_seen_at < datetime('now', '-1 minutes'))`
  ).run(row.id);

  return rowToUser(row);
}
