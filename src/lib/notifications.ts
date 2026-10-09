import { db } from "./db";
import { getPublicUserById, type PublicUser } from "./auth";
import { getDictionary, type Locale } from "./i18n";
import { sendPushToUser } from "./push";

export type NotificationType = "friend_added" | "friend_listing" | "listing_comment" | "listing_like";

export interface AppNotification {
  id: number;
  type: NotificationType;
  actor: PublicUser | null;
  listingId: number | null;
  listingTitle: string | null;
  createdAt: string;
  readAt: string | null;
}

interface NotificationRow {
  id: number;
  type: NotificationType;
  actor_id: number | null;
  listing_id: number | null;
  listing_title: string | null;
  created_at: string;
  read_at: string | null;
}

// Likes only show in the feed: a like can be toggled endlessly, and each
// toggle shouldn't ring someone's phone.
const PUSHED_TYPES: ReadonlySet<NotificationType> = new Set([
  "friend_added",
  "friend_listing",
  "listing_comment",
]);

// The sentence for a notification type, with {name} and {title} still in it.
export function notificationTemplate(locale: Locale, type: NotificationType): string {
  const t = getDictionary(locale).notifications;
  return {
    friend_added: t.friendAdded,
    friend_listing: t.friendListing,
    listing_comment: t.listingComment,
    listing_like: t.listingLike,
  }[type];
}

export function notificationText(
  locale: Locale,
  n: { type: NotificationType; actorName: string; listingTitle: string | null }
): string {
  return notificationTemplate(locale, n.type).replace("{name}", n.actorName).replace("{title}", n.listingTitle ?? "");
}

export function notificationUrl(n: { type: NotificationType; actorId: number | null; listingId: number | null }): string {
  if (n.type === "friend_added") return n.actorId ? `/profil/${n.actorId}` : "/bildirishnomalar";
  return n.listingId ? `/elonlar/${n.listingId}` : "/bildirishnomalar";
}

// Records a notification for `userId` and pushes it to their devices.
// Repeating the same event (unfriend then re-add, unlike then re-like)
// replaces the earlier entry rather than stacking duplicates.
export function notify(params: {
  userId: number;
  type: NotificationType;
  actorId: number;
  listingId?: number | null;
}): void {
  const { userId, type, actorId } = params;
  const listingId = params.listingId ?? null;
  if (userId === actorId) return;

  removeNotification({ userId, type, actorId, listingId });
  db.prepare("INSERT INTO notifications (user_id, type, actor_id, listing_id) VALUES (?, ?, ?, ?)").run(
    userId,
    type,
    actorId,
    listingId
  );

  if (!PUSHED_TYPES.has(type)) return;
  const actor = getPublicUserById(actorId);
  const listingTitle = listingId
    ? ((db.prepare("SELECT title FROM listings WHERE id = ?").get(listingId) as { title: string } | undefined)?.title ??
      null)
    : null;
  void sendPushToUser(userId, (locale) => ({
    title: "Findo",
    body: notificationText(locale, {
      type,
      actorName: actor?.name ?? getDictionary(locale).notifications.someone,
      listingTitle,
    }),
    url: notificationUrl({ type, actorId, listingId }),
    tag: `${type}-${actorId}-${listingId ?? ""}`,
  }));
}

export function removeNotification(params: {
  userId: number;
  type: NotificationType;
  actorId: number;
  listingId?: number | null;
}): void {
  db.prepare(
    "DELETE FROM notifications WHERE user_id = ? AND type = ? AND actor_id = ? AND listing_id IS ?"
  ).run(params.userId, params.type, params.actorId, params.listingId ?? null);
}

export function getNotifications(userId: number, limit = 50): AppNotification[] {
  const rows = db
    .prepare(
      `SELECT n.id, n.type, n.actor_id, n.listing_id, l.title AS listing_title, n.created_at, n.read_at
       FROM notifications n LEFT JOIN listings l ON l.id = n.listing_id
       WHERE n.user_id = ? ORDER BY n.created_at DESC, n.id DESC LIMIT ?`
    )
    .all(userId, limit) as NotificationRow[];
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    actor: r.actor_id ? getPublicUserById(r.actor_id) : null,
    listingId: r.listing_id,
    listingTitle: r.listing_title,
    createdAt: r.created_at,
    readAt: r.read_at,
  }));
}

export function unreadNotificationCount(userId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL")
    .get(userId) as { c: number };
  return row.c;
}

export function markAllNotificationsRead(userId: number): void {
  db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL").run(userId);
}
