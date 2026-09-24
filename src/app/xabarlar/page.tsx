import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Tag as TagIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getConversations, getGuestNotifications, markAllGuestNotificationsRead } from "@/lib/messages";
import { formatDate } from "@/lib/data";
import Avatar from "@/components/Avatar";
import UserSearch from "@/components/UserSearch";

export const metadata: Metadata = {
  title: "Xabarlar — Topamiz",
};

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");

  const guestNotifications = getGuestNotifications(user.id);
  markAllGuestNotificationsRead(user.id);
  const conversations = getConversations(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Xabarlar</h1>
      <div className="mt-4">
        <UserSearch />
      </div>

      {guestNotifications.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            QR-belgi orqali xabarlar
          </h2>
          <div className="space-y-2">
            {guestNotifications.map((n) => (
              <div
                key={n.id}
                className="flex gap-3 rounded-xl border border-accent-gold/25 bg-accent-gold/5 p-3.5"
              >
                {n.tagPhotoUrl && (
                  <Link
                    href={n.tagCode ? `/t/${n.tagCode}` : "#"}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border"
                  >
                    <Image src={n.tagPhotoUrl} alt={n.tagTitle ?? "Buyum"} fill sizes="56px" className="object-cover" />
                  </Link>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent-gold">
                    <TagIcon className="h-3.5 w-3.5" />
                    {n.tagCode ? (
                      <Link href={`/t/${n.tagCode}`} className="hover:underline">
                        {n.tagTitle ?? "Buyum"}
                      </Link>
                    ) : (
                      n.tagTitle ?? "Buyum"
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-foreground">{n.body}</p>
                  <p className="mt-1.5 text-xs text-muted">
                    {n.guestName ?? "Nomsiz"}
                    {n.guestPhone ? ` · ${n.guestPhone}` : ""} · {formatDate(n.createdAt.slice(0, 10))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Suhbatlar</h2>
        {conversations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
            Hali suhbatlaringiz yo'q. Yuqoridan odam qidirib, birinchi xabarni yozing.
          </p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {conversations.map((c) => (
              <Link
                key={c.otherUser.id}
                href={`/xabarlar/${c.otherUser.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
              >
                <Avatar name={c.otherUser.name} color={c.otherUser.avatarColor} avatarUrl={c.otherUser.avatarUrl} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{c.otherUser.name}</p>
                    <span className="shrink-0 text-xs text-muted">
                      {formatDate(c.lastMessage.createdAt.slice(0, 10))}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted">{c.lastMessage.body}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full btn-brand px-1.5 text-[11px] font-bold text-white">
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
