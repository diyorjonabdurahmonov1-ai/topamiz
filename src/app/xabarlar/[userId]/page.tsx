import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { getThread, markThreadRead } from "@/lib/messages";
import Avatar from "@/components/Avatar";
import ChatThread from "@/components/ChatThread";

export async function generateMetadata(
  props: PageProps<"/xabarlar/[userId]">
): Promise<Metadata> {
  const { userId } = await props.params;
  const other = getUserById(Number(userId));
  return { title: other ? `${other.name} — Xabarlar — Topamiz` : "Xabarlar — Topamiz" };
}

export default async function ChatPage(props: PageProps<"/xabarlar/[userId]">) {
  const { userId } = await props.params;
  const otherId = Number(userId);

  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  if (otherId === user.id) redirect("/xabarlar");

  const other = getUserById(otherId);
  if (!other) notFound();

  markThreadRead(user.id, otherId);
  const messages = getThread(user.id, otherId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/xabarlar"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link href={`/profil/${other.id}`} className="flex items-center gap-2.5">
          <Avatar name={other.name} color={other.avatarColor} size={36} />
          <span className="text-sm font-bold">{other.name}</span>
        </Link>
      </div>

      <ChatThread otherUserId={otherId} currentUserId={user.id} initialMessages={messages} />
    </div>
  );
}
