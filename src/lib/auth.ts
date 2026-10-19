import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { db } from "./db";
import { nameKey } from "./name-key";
import { BRAND_NAME, isReservedName, MAX_NAME_LENGTH, uniqueName } from "./user-names";

export const SESSION_COOKIE = "topamiz_session";
const SESSION_DAYS = 30;
export { BRAND_NAME, isReservedName, MAX_NAME_LENGTH };
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

// What other people may see of a user — never their email or phone number.
export type PublicUser = Omit<AuthUser, "email">;

// Already carries the admin's brand identity, so public views don't need
// the email to work it out.
export function toPublicUser(user: AuthUser): PublicUser {
  return { id: user.id, bio: user.bio, createdAt: user.createdAt, ...displayIdentity(user) };
}

// What other people see of a user: nothing at all once an admin has blocked
// them, so they drop out of search, friend lists, chats, comments and
// notifications everywhere this is used. Admin pages read users directly.
export function getPublicUserById(id: number): PublicUser | null {
  const user = getUserById(id);
  return user && !isUserBlocked(id) ? toPublicUser(user) : null;
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

// The account's own phone number (phone sign-up only) — for prefilling the
// owner's own forms, never for showing to anyone else.
export function getUserPhone(id: number): string | null {
  const row = db.prepare("SELECT phone FROM users WHERE id = ?").get(id) as { phone: string | null } | undefined;
  return row?.phone ?? null;
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

  // Names are unique (lib/user-names): a Google name someone already has
  // gets a number, which its owner can change on their profile.
  const name = uniqueName(params.name.trim().slice(0, MAX_NAME_LENGTH) || params.email.split("@")[0]);
  const avatarColor = pickAvatarColor(params.email);
  const info = db
    .prepare(
      `INSERT INTO users (google_id, email, name, name_key, avatar_color, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(params.googleId, params.email, name, nameKey(name), avatarColor, params.avatarUrl ?? null);
  const user = getUserById(Number(info.lastInsertRowid));
  if (!user) throw new Error("Foydalanuvchi yaratilmadi");
  return user;
}

const SCRYPT_KEYLEN = 64;

// Stored as "scrypt$<salt>$<hash>" — never the password itself.
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  const [scheme, saltHex, hashHex] = (stored ?? "").split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// `phone` is always +998XXXXXXXXX.
export function getPhoneAccount(phone: string): { user: AuthUser; passwordHash: string | null } | null {
  const row = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as
    | (UserRow & { password_hash: string | null })
    | undefined;
  return row ? { user: rowToUser(row), passwordHash: row.password_hash } : null;
}

export function createPhoneUser(params: { phone: string; name: string; password: string }): AuthUser {
  const info = db
    .prepare(
      `INSERT INTO users (phone, password_hash, name, name_key, avatar_color, terms_accepted_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(params.phone, hashPassword(params.password), params.name, nameKey(params.name), pickAvatarColor(params.phone));
  const user = getUserById(Number(info.lastInsertRowid));
  if (!user) throw new Error("Foydalanuvchi yaratilmadi");
  return user;
}

export function setUserPassword(userId: number, password: string): void {
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), userId);
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

function parseUrls(raw: string | null): string[] {
  try {
    const value = JSON.parse(raw || "[]");
    return Array.isArray(value) ? value.filter((u): u is string => typeof u === "string") : [];
  } catch {
    return [];
  }
}

// Permanent: removes the account and everything that belongs to it — their
// listings (with the likes, comments and reports on them), the messages
// they sent, and through the FK cascades their sessions, tags, comments,
// likes, friendships, notifications, push subscriptions and messages sent
// to them. Google Play requires an account's data to go with it, and a
// listing left behind would keep their name and phone number public.
// resolved_by has no FK (added via a later ALTER TABLE), so it's cleared by
// hand. Returns the URLs of the photos and videos those rows pointed at, for
// the caller to delete from disk and R2 (lib/stored-files.ts).
export function deleteUserAccount(userId: number): string[] {
  const files: string[] = [];
  const tx = db.transaction(() => {
    const listings = db
      .prepare("SELECT photo_urls, video_url, video_thumbnail_url FROM listings WHERE owner_id = ?")
      .all(userId) as { photo_urls: string; video_url: string | null; video_thumbnail_url: string | null }[];
    for (const l of listings) {
      files.push(...parseUrls(l.photo_urls));
      if (l.video_url) files.push(l.video_url);
      if (l.video_thumbnail_url) files.push(l.video_thumbnail_url);
    }
    for (const t of db.prepare("SELECT photo_urls FROM tags WHERE owner_id = ?").all(userId) as { photo_urls: string }[]) {
      files.push(...parseUrls(t.photo_urls));
    }
    for (const m of db.prepare("SELECT photo_urls FROM messages WHERE sender_id = ?").all(userId) as { photo_urls: string }[]) {
      files.push(...parseUrls(m.photo_urls));
    }
    const avatar = db.prepare("SELECT avatar_url FROM users WHERE id = ?").get(userId) as
      | { avatar_url: string | null }
      | undefined;
    if (avatar?.avatar_url) files.push(avatar.avatar_url);

    db.prepare("UPDATE listings SET resolved_by = NULL WHERE resolved_by = ?").run(userId);
    db.prepare("DELETE FROM messages WHERE sender_id = ?").run(userId);
    db.prepare("DELETE FROM listings WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  });
  tx();
  return files;
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

// Every admin page calls this itself, first thing. The check in
// app/admin/layout.tsx isn't enough on its own: Next.js renders a page in
// parallel with its layout, so a page relying only on the layout's
// redirect still streams its data (the user list, messages…) to whoever
// requested it — the redirect only happens afterwards in the browser.
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) redirect("/");
  return user;
}

// The admin's messages should read as coming from the platform itself, not
// their personal Google account — reserved so no regular user can impersonate it.
const BRAND_AVATAR_COLOR = "#6366f1";

// A PublicUser (no email) already has the brand identity applied by
// toPublicUser, so only a full user needs the admin check here.
export function displayIdentity(
  user: Pick<AuthUser, "name" | "avatarColor" | "avatarUrl"> & { email?: string }
): { name: string; avatarColor: string; avatarUrl: string | null } {
  if (user.email && isAdmin({ email: user.email })) {
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
