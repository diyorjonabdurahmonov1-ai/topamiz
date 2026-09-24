import Database from "better-sqlite3";
import path from "node:path";
import { mkdirSync } from "node:fs";

const DATA_DIR = path.join(process.cwd(), ".data");
// Tests point this at ":memory:" (see vitest.config.ts) to run against an
// isolated, throwaway database instead of the real one on disk.
const DB_PATH = process.env.TOPAMIZ_DB_PATH ?? path.join(DATA_DIR, "topamiz.db");
if (DB_PATH !== ":memory:") {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Cached on `global` so dev-mode hot reload doesn't reopen the file on every edit.
const globalForDb = globalThis as unknown as { __topamizDb?: Database.Database };

export const db = globalForDb.__topamizDb ?? new Database(DB_PATH);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__topamizDb = db;
}

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT,
    name TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    avatar_color TEXT NOT NULL,
    avatar_url TEXT,
    is_premium INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_urls TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id INTEGER REFERENCES tags(id) ON DELETE SET NULL,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guest_name TEXT,
    guest_phone TEXT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    read_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL,
    link_url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
  CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_messages_tag ON messages(tag_id);
  CREATE INDEX IF NOT EXISTS idx_tags_owner ON tags(owner_id);
  CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(active, sort_order);
`);

// Migrate a database created before Google sign-in: the old `users` table
// required phone+password_hash (NOT NULL) and had no email/google_id/
// avatar_url columns. SQLite can't relax a NOT NULL constraint in place, so
// rebuild the table and copy every existing row across untouched.
const userColumns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
if (!userColumns.some((c) => c.name === "google_id")) {
  // SQLite can't change a NOT NULL constraint in place, and foreign_keys
  // can't be toggled inside a transaction — follow SQLite's documented
  // 12-step procedure for altering a table other tables reference.
  db.pragma("foreign_keys = OFF");
  db.exec(`
    BEGIN TRANSACTION;

    CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT,
      name TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      avatar_color TEXT NOT NULL,
      avatar_url TEXT,
      is_premium INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT INTO users_new (id, phone, password_hash, name, bio, avatar_color, is_premium, created_at)
      SELECT id, phone, password_hash, name, bio, avatar_color, is_premium, created_at FROM users;

    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;

    COMMIT;
  `);
  db.pragma("foreign_keys = ON");
}

// Admin panel needs online tracking and blocking — both nullable, so a
// plain ADD COLUMN (no rebuild) is enough.
const userColumns2 = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
if (!userColumns2.some((c) => c.name === "last_seen_at")) {
  db.exec("ALTER TABLE users ADD COLUMN last_seen_at TEXT");
}
if (!userColumns2.some((c) => c.name === "blocked_at")) {
  db.exec("ALTER TABLE users ADD COLUMN blocked_at TEXT");
}
