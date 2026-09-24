import crypto from "node:crypto";
import { db } from "./db";
import { getUserById, type AuthUser } from "./auth";

export const FREE_TAG_LIMIT = 2;
export const MAX_TAG_TITLE_LENGTH = 100;
export const MAX_TAG_DESCRIPTION_LENGTH = 1000;
export const MAX_TAG_PHOTOS = 5;

export interface ItemTag {
  id: number;
  code: string;
  ownerId: number;
  title: string;
  description: string;
  photoUrls: string[];
  status: "active" | "resolved";
  createdAt: string;
}

interface RawTagRow {
  id: number;
  code: string;
  owner_id: number;
  title: string;
  description: string;
  photo_urls: string;
  status: string;
  created_at: string;
}

function toTag(row: RawTagRow): ItemTag {
  return {
    id: row.id,
    code: row.code,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    photoUrls: JSON.parse(row.photo_urls) as string[],
    status: row.status as ItemTag["status"],
    createdAt: row.created_at,
  };
}

function generateCode(): string {
  return crypto.randomBytes(5).toString("hex");
}

export function countActiveTags(ownerId: number): number {
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM tags WHERE owner_id = ? AND status = 'active'`)
    .get(ownerId) as { c: number };
  return row.c;
}

export function createTag(params: {
  ownerId: number;
  title: string;
  description: string;
  photoUrls: string[];
}): ItemTag {
  let code = generateCode();
  while (db.prepare("SELECT 1 FROM tags WHERE code = ?").get(code)) {
    code = generateCode();
  }
  const info = db
    .prepare(
      `INSERT INTO tags (code, owner_id, title, description, photo_urls) VALUES (?, ?, ?, ?, ?)`
    )
    .run(code, params.ownerId, params.title, params.description, JSON.stringify(params.photoUrls));
  const row = db.prepare("SELECT * FROM tags WHERE id = ?").get(info.lastInsertRowid) as RawTagRow;
  return toTag(row);
}

export function getTagByCode(code: string): ItemTag | null {
  const row = db.prepare("SELECT * FROM tags WHERE code = ?").get(code) as RawTagRow | undefined;
  return row ? toTag(row) : null;
}

export function getTagsByOwner(ownerId: number): ItemTag[] {
  const rows = db
    .prepare("SELECT * FROM tags WHERE owner_id = ? ORDER BY created_at DESC")
    .all(ownerId) as RawTagRow[];
  return rows.map(toTag);
}

export function getTagOwner(tag: ItemTag): AuthUser | null {
  return getUserById(tag.ownerId);
}

export function deleteTag(code: string, ownerId: number): boolean {
  const info = db.prepare("DELETE FROM tags WHERE code = ? AND owner_id = ?").run(code, ownerId);
  return info.changes > 0;
}
