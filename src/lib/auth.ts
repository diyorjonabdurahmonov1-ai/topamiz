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
