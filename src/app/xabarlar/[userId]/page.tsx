import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { displayIdentity, getCurrentUser, getUserById, isAdmin } from "@/lib/auth";
import { getThread, markThreadRead } from "@/lib/messages";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import Avatar from "@/components/Avatar";
import ChatThread from "@/components/ChatThread";
import RefreshOnMount from "@/components/RefreshOnMount";

export async function generateMetadata(
  props: PageProps<"/xabarlar/[userId]">
): Promise<Metadata> {
  const { userId } = await props.params;
  const other = getUserById(Number(userId));
  const name = other ? displayIdentity(other).name : null;
  return { title: name ? `${name} — Xabarlar — Findo` : "Xabarlar — Findo" };
}

export default async function ChatPage(props: PageProps<"/xabarlar/[userId]">) {
  const { userId } = await props.params;
  const otherId = Number(userId);

  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  if (otherId === user.id) redirect("/xabarlar");

  const other = getUserById(otherId);
  if (!other) notFound();

  const hadUnread = getThread(user.id, otherId).some(
    (m) => m.recipientId === user.id && !m.readAt
  );
  markThreadRead(user.id, otherId);
  const messages = getThread(user.id, otherId);
  const dict = getDictionary(await getLocale());
  const identity = displayIdentity(other);
  const otherIsAdmin = isAdmin(other);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {hadUnread && <RefreshOnMount />}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/xabarlar"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {otherIsAdmin ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={identity.name} color={identity.avatarColor} avatarUrl={identity.avatarUrl} size={36} />
            <span className="text-sm font-bold">{identity.name}</span>
          </div>
        ) : (
          <Link href={`/profil/${other.id}`} className="flex items-center gap-2.5">
            <Avatar name={identity.name} color={identity.avatarColor} avatarUrl={identity.avatarUrl} size={36} />
            <span className="text-sm font-bold">{identity.name}</span>
          </Link>
        )}
      </div>

      <ChatThread otherUserId={otherId} currentUserId={user.id} initialMessages={messages} dict={dict} />
    </div>
  );
}
