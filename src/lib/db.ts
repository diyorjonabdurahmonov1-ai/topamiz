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
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    avatar_color TEXT NOT NULL,
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

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
  CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_messages_tag ON messages(tag_id);
  CREATE INDEX IF NOT EXISTS idx_tags_owner ON tags(owner_id);
`);
