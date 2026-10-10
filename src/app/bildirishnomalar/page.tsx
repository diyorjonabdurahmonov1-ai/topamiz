import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Heart, MessageSquare, Sparkles, UserPlus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/data";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import {
  getNotifications,
  markAllNotificationsRead,
  notificationTemplate,
  notificationUrl,
  type NotificationType,
} from "@/lib/notifications";
import Avatar from "@/components/Avatar";
import RefreshOnMount from "@/components/RefreshOnMount";
import PushNotificationToggle from "@/components/PushNotificationToggle";

export const metadata: Metadata = {
  title: "Bildirishnomalar — Findo",
};

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  friend_added: UserPlus,
  friend_listing: Sparkles,
  listing_comment: MessageSquare,
  listing_like: Heart,
};

// Every template starts with {name}; the name is set in bold, Instagram-style.
function renderText(template: string, name: string, title: string | null) {
  const [before, after = ""] = template.split("{name}");
  return (
    <>
      {before}
      <span className="font-bold text-foreground">{name}</span>
      {after.replace("{title}", title ?? "")}
    </>
  );
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const notifications = getNotifications(user.id);
  const hadUnread = notifications.some((n) => !n.readAt);
  markAllNotificationsRead(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {hadUnread && <RefreshOnMount />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">{dict.notifications.title}</h1>
        <PushNotificationToggle dict={dict} />
      </div>

      {notifications.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-via/10 text-brand-via">
            <Bell className="h-6 w-6" />
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted">{dict.notifications.empty}</p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type];
            const actorName = n.actor?.name ?? dict.notifications.someone;
            return (
              <Link
                key={n.id}
                href={notificationUrl({ type: n.type, actorId: n.actor?.id ?? null, listingId: n.listingId })}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-2 ${n.readAt ? "" : "bg-brand-via/5"}`}
              >
                <div className="relative shrink-0">
                  <Avatar
                    name={actorName}
                    color={n.actor?.avatarColor ?? "#6366f1"}
                    avatarUrl={n.actor?.avatarUrl ?? null}
                    size={44}
                  />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-gradient-to-br from-brand-from to-brand-via text-white">
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-muted">
                    {renderText(notificationTemplate(locale, n.type), actorName, n.listingTitle)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{formatDate(n.createdAt.slice(0, 10))}</p>
                </div>
                {!n.readAt && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-via" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
