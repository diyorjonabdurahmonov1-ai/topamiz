import { NextResponse } from "next/server";
import { displayIdentity, getCurrentUser, getUserById } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { getLatestUnreadMessage, unreadTotal } from "@/lib/messages";
import { getNotifications, notificationText, notificationUrl, unreadNotificationCount } from "@/lib/notifications";

// Polled by NotificationCenter while the site is open, so a new message or
// notification chimes even on devices where push isn't turned on. Along
// with the counts it returns what the newest unread item says, for the toast.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const message = getLatestUnreadMessage(user.id);
  const sender = message?.senderId ? getUserById(message.senderId) : null;
  const [notification] = getNotifications(user.id, 1);

  return NextResponse.json(
    {
      messages: unreadTotal(user.id),
      notifications: unreadNotificationCount(user.id),
      latestMessage: message && {
        title: sender ? displayIdentity(sender).name : (message.guestName ?? dict.messages.noNameFallback),
        body: message.body,
        url: message.senderId ? `/xabarlar/${message.senderId}` : "/xabarlar",
      },
      latestNotification:
        notification && !notification.readAt
          ? {
              title: dict.notifications.title,
              body: notificationText(locale, {
                type: notification.type,
                actorName: notification.actor?.name ?? dict.notifications.someone,
                listingTitle: notification.listingTitle,
              }),
              url: notificationUrl({
                type: notification.type,
                actorId: notification.actor?.id ?? null,
                listingId: notification.listingId,
              }),
            }
          : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
