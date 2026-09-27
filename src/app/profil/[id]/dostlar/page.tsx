import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getUserById } from "@/lib/auth";
import { getFriends } from "@/lib/friends";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import Avatar from "@/components/Avatar";

export async function generateMetadata(props: PageProps<"/profil/[id]/dostlar">): Promise<Metadata> {
  const { id } = await props.params;
  const user = getUserById(Number(id));
  return { title: user ? `${user.name} — Do'stlar — Findo` : "Foydalanuvchi topilmadi — Findo" };
}

export default async function FriendsListPage(props: PageProps<"/profil/[id]/dostlar">) {
  const { id } = await props.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) notFound();

  const user = getUserById(userId);
  if (!user) notFound();
  const dict = getDictionary(await getLocale());
  const friends = getFriends(userId);

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <Link
        href={`/profil/${userId}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {user.name}
      </Link>
      <h1 className="mt-3 text-xl font-extrabold tracking-tight">{dict.publicProfile.friendsHeading}</h1>

      {friends.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          {dict.publicProfile.noFriends}
        </p>
      ) : (
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {friends.map((friend) => (
            <Link
              key={friend.id}
              href={`/profil/${friend.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
            >
              <Avatar name={friend.name} color={friend.avatarColor} avatarUrl={friend.avatarUrl} size={44} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{friend.name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
