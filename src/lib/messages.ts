import { db } from "./db";
import { getUserById, type AuthUser } from "./auth";

export const MAX_MESSAGE_LENGTH = 2000;

export interface MessageRow {
  id: number;
  tagId: number | null;
  senderId: number | null;
  recipientId: number;
  guestName: string | null;
  guestPhone: string | null;
  body: string;
  createdAt: string;
  readAt: string | null;
}

interface RawMessageRow {
  id: number;
  tag_id: number | null;
  sender_id: number | null;
  recipient_id: number;
  guest_name: string | null;
  guest_phone: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
}

function toMessage(row: RawMessageRow): MessageRow {
  return {
    id: row.id,
    tagId: row.tag_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export function searchUsers(query: string, excludeUserId: number, limit = 10): AuthUser[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const like = `%${trimmed}%`;
  const rows = db
    .prepare(`SELECT id FROM users WHERE id != ? AND (name LIKE ? OR email LIKE ?) LIMIT ?`)
    .all(excludeUserId, like, like, limit) as { id: number }[];
  return rows.map((r) => getUserById(r.id)).filter((u): u is AuthUser => !!u);
}

export interface ConversationSummary {
  otherUser: AuthUser;
  lastMessage: MessageRow;
  unreadCount: number;
}

export function getConversations(userId: number): ConversationSummary[] {
  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE sender_id IS NOT NULL AND (sender_id = ? OR recipient_id = ?)
       ORDER BY created_at ASC`
    )
    .all(userId, userId) as RawMessageRow[];

  const byOther = new Map<number, MessageRow[]>();
  for (const raw of rows) {
    const m = toMessage(raw);
    const otherId = m.senderId === userId ? m.recipientId : m.senderId!;
    const list = byOther.get(otherId) ?? [];
    list.push(m);
    byOther.set(otherId, list);
  }

  const result: ConversationSummary[] = [];
  for (const [otherId, msgs] of byOther.entries()) {
    const otherUser = getUserById(otherId);
    if (!otherUser) continue;
    const lastMessage = msgs[msgs.length - 1];
    const unreadCount = msgs.filter((m) => m.recipientId === userId && !m.readAt).length;
    result.push({ otherUser, lastMessage, unreadCount });
  }

  result.sort((a, b) => (a.lastMessage.createdAt < b.lastMessage.createdAt ? 1 : -1));
  return result;
}

export function getThread(userId: number, otherId: number): MessageRow[] {
  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE sender_id IS NOT NULL AND (
         (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
       )
       ORDER BY created_at ASC`
    )
    .all(userId, otherId, otherId, userId) as RawMessageRow[];
  return rows.map(toMessage);
}

export function sendMessage(params: {
  senderId: number | null;
  recipientId: number;
  body: string;
  tagId?: number;
  guestName?: string;
  guestPhone?: string;
}): MessageRow {
  const info = db
    .prepare(
      `INSERT INTO messages (tag_id, sender_id, recipient_id, guest_name, guest_phone, body)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      params.tagId ?? null,
      params.senderId,
      params.recipientId,
      params.guestName ?? null,
      params.guestPhone ?? null,
      params.body
    );
  const row = db
    .prepare("SELECT * FROM messages WHERE id = ?")
    .get(info.lastInsertRowid) as RawMessageRow;
  return toMessage(row);
}

export function markThreadRead(userId: number, otherId: number) {
  db.prepare(
    `UPDATE messages SET read_at = datetime('now')
     WHERE recipient_id = ? AND sender_id = ? AND read_at IS NULL`
  ).run(userId, otherId);
}

export interface GuestNotification extends MessageRow {
  tagTitle: string | null;
  tagCode: string | null;
  tagPhotoUrl: string | null;
}

export function getGuestNotifications(userId: number): GuestNotification[] {
  const rows = db
    .prepare(
      `SELECT m.*, t.title as tag_title, t.code as tag_code, t.photo_urls as tag_photo_urls
       FROM messages m LEFT JOIN tags t ON t.id = m.tag_id
       WHERE m.recipient_id = ? AND m.sender_id IS NULL
       ORDER BY m.created_at DESC`
    )
    .all(userId) as (RawMessageRow & {
    tag_title: string | null;
    tag_code: string | null;
    tag_photo_urls: string | null;
  })[];
  return rows.map((row) => {
    const photos = row.tag_photo_urls ? (JSON.parse(row.tag_photo_urls) as string[]) : [];
    return {
      ...toMessage(row),
      tagTitle: row.tag_title,
      tagCode: row.tag_code,
      tagPhotoUrl: photos[0] ?? null,
    };
  });
}

export function markAllGuestNotificationsRead(userId: number) {
  db.prepare(
    `UPDATE messages SET read_at = datetime('now')
     WHERE recipient_id = ? AND sender_id IS NULL AND read_at IS NULL`
  ).run(userId);
}

export function unreadTotal(userId: number): number {
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM messages WHERE recipient_id = ? AND read_at IS NULL`)
    .get(userId) as { c: number };
  return row.c;
}
