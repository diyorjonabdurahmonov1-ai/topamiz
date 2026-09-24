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

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT,
    reward INTEGER,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    photo_urls TEXT NOT NULL DEFAULT '[]',
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS listing_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(listing_id, reporter_id)
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
  CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_messages_tag ON messages(tag_id);
  CREATE INDEX IF NOT EXISTS idx_tags_owner ON tags(owner_id);
  CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(active, sort_order);
  CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
  CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id);
  CREATE INDEX IF NOT EXISTS idx_listing_reports_listing ON listing_reports(listing_id);
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
if (!userColumns2.some((c) => c.name === "moderation_strikes")) {
  db.exec("ALTER TABLE users ADD COLUMN moderation_strikes INTEGER NOT NULL DEFAULT 0");
}

// Seed the listings table once, on the very first run, with the same
// example content this app shipped with before listings were DB-backed —
// as real rows (owner_id NULL) so they behave identically to a genuine
// user's listing (reportable, deletable, etc.) instead of being a
// separate hardcoded array.
const listingCount = (db.prepare("SELECT COUNT(*) as c FROM listings").get() as { c: number }).c;
if (listingCount === 0) {
  const insertSeed = db.prepare(
    `INSERT INTO listings
      (kind, title, description, category, city, district, reward, contact_name, contact_phone, status, views, created_at)
     VALUES (@kind, @title, @description, @category, @city, @district, @reward, @contact_name, @contact_phone, @status, @views, @created_at)`
  );
  const seedListings = [
    { kind: "lost", title: "Qora rangli pasport va haydovchilik guvohnomasi", description: "Chilonzor metro bekati yaqinida, avtobusda hujjatlarim solingan qora papka tushib qolgan. Ichida pasport, haydovchilik guvohnomasi va bank kartasi bor.", category: "hujjatlar", city: "Toshkent", district: "Chilonzor", reward: 300000, contact_name: "Aziz Karimov", contact_phone: "+998 90 123 45 67", status: "active", views: 482, created_at: "2026-09-14 09:00:00" },
    { kind: "found", title: "iPhone 13, ko'k rangli, ekran himoyasi bilan", description: "Amir Temur xiyoboni skverida skameykada topildi. Qulf ekrani ochilmagan, ega bo'lsa tasvirini yuborib tasdiqlashi kerak.", category: "texnika", city: "Toshkent", district: "Yunusobod", reward: null, contact_name: "Dilnoza Yusupova", contact_phone: "+998 91 234 56 78", status: "active", views: 915, created_at: "2026-09-15 09:00:00" },
    { kind: "lost", title: "Jasur ismli oq-jigarrang uy mushugi", description: "Bizning mushugimiz Jasur balkondan chiqib ketgan, bo'ynida qizil ipdan qilingan taqinchoq bor, juda quvnoq va odamlarga o'rganib qolgan.", category: "hayvonlar", city: "Samarqand", district: "Markaziy", reward: 500000, contact_name: "Malika Tosheva", contact_phone: "+998 93 345 67 89", status: "active", views: 1204, created_at: "2026-09-12 09:00:00" },
    { kind: "found", title: "Qora charm hamyon, ichida naqd pul va kartalar", description: "Bozor hududida yerda yotgan hamyon topildi. Ichida bir nechta bank kartasi va shaxsiy hujjat bor, ega bo'lsa politsiya orqali yoki to'g'ridan-to'g'ri bog'lanishi mumkin.", category: "sumka", city: "Buxoro", district: null, reward: null, contact_name: "Sardor Aliyev", contact_phone: "+998 94 456 78 90", status: "active", views: 356, created_at: "2026-09-13 09:00:00" },
    { kind: "lost", title: "Mashina kalitlari, Chevrolet belgisi bilan", description: "Ikkita kalit ulangan, biri mashina uchun, ikkinchisi kvartira eshigi uchun. Katta bozor atrofida yo'qotilgan.", category: "kalitlar", city: "Andijon", district: null, reward: 150000, contact_name: "Bekzod Nazarov", contact_phone: "+998 95 567 89 01", status: "active", views: 210, created_at: "2026-09-10 09:00:00" },
    { kind: "found", title: "Bolalar uchun sariq velosiped", description: "Hovli oldida ostona yaqinida turgan kichik sariq velosiped topildi, egasi tasvirlab bersa qaytariladi.", category: "boshqa", city: "Namangan", district: null, reward: null, contact_name: "Nodira Rashidova", contact_phone: "+998 97 678 90 12", status: "resolved", views: 128, created_at: "2026-09-09 09:00:00" },
    { kind: "lost", title: "Ko'k rangli sport kurtka, orqasida raqam bor", description: "Stadion yaqinida sport zali kiyinish xonasida qoldirilgan bo'lishi mumkin, kurtkaning ichki cho'ntagida talaba bileti bor.", category: "kiyim", city: "Farg'ona", district: null, reward: null, contact_name: "Ulug'bek Qodirov", contact_phone: "+998 99 789 01 23", status: "active", views: 97, created_at: "2026-09-08 09:00:00" },
    { kind: "found", title: "Samsung planshet, jigarrang g'ilof bilan", description: "Kutubxona o'qish zalida stol ustida qoldirilgan planshet topildi. Xavfsizlik xonasida saqlanmoqda.", category: "texnika", city: "Toshkent", district: "Mirzo Ulug'bek", reward: null, contact_name: "Kamola Sattorova", contact_phone: "+998 90 890 12 34", status: "active", views: 274, created_at: "2026-09-07 09:00:00" },
    { kind: "lost", title: "Oltin rangli uzuk, ichiga ism yozilgan", description: "To'y marosimidan qaytishda mehmonxona hovlisida tushib qolgan bo'lishi mumkin. Uzuk ichiga \"M & A\" harflari yozilgan, juda qadrli xotira.", category: "boshqa", city: "Toshkent", district: "Shayxontohur", reward: 1000000, contact_name: "Munisa Ergasheva", contact_phone: "+998 93 901 23 45", status: "active", views: 641, created_at: "2026-09-16 09:00:00" },
    { kind: "found", title: "Kumush rangli AirPods, futlyari bilan", description: "Universitet oshxonasi yonidagi skameykada topildi, futlyarida kichik chizilgan belgisi bor.", category: "texnika", city: "Samarqand", district: null, reward: null, contact_name: "Javlon Mirzayev", contact_phone: "+998 91 012 34 56", status: "active", views: 189, created_at: "2026-09-11 09:00:00" },
    { kind: "lost", title: "Jigarrang ryukzak, noutbuk va daftarlar bilan", description: "Elektron poyezdda yoki bekatda qoldirilgan bo'lishi mumkin. Ichida ish noutbuki va muhim hujjatlar bor, mukofot beriladi.", category: "sumka", city: "Toshkent", district: "Mirobod", reward: 400000, contact_name: "Sherzod Yoldashev", contact_phone: "+998 94 123 45 67", status: "active", views: 523, created_at: "2026-09-15 15:00:00" },
    { kind: "lost", title: "Kichik oq kuchukcha, quloqlari uzun", description: "Bog' aylanasida sayr paytida yo'qolgan, juda qo'rqoq va begonalardan yashiradi, iltimos ko'rgan bo'lsangiz xabar bering.", category: "hayvonlar", city: "Qarshi", district: null, reward: 250000, contact_name: "Zilola Ahmedova", contact_phone: "+998 95 234 56 78", status: "active", views: 334, created_at: "2026-09-16 15:00:00" },
  ];
  for (const listing of seedListings) insertSeed.run(listing);
}
