import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { getFollowerCount, getFollowers, getFriendCount, getFriendIdSet, getFriends } from "@/lib/friends";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import Avatar from "@/components/Avatar";
import FriendButton from "@/components/FriendButton";

export async function generateMetadata(props: PageProps<"/profil/[id]/dostlar">): Promise<Metadata> {
  const { id } = await props.params;
  const user = getUserById(Number(id));
  return { title: user ? `${user.name} — Do'stlar — Findo` : "Foydalanuvchi topilmadi — Findo" };
}

// Two tabs: the people this user added ("friends") and the people who
// added them ("followers") — each row lets the viewer add that person too.
export default async function FriendsListPage(props: PageProps<"/profil/[id]/dostlar">) {
  const { id } = await props.params;
  const { tab } = await props.searchParams;
  const userId = Number(id);
  if (!Number.isInteger(userId)) notFound();

  const user = getUserById(userId);
  if (!user) notFound();
  const dict = getDictionary(await getLocale());
  const viewer = await getCurrentUser();

  const showFollowers = tab === "obunachilar";
  const people = showFollowers ? getFollowers(userId) : getFriends(userId);
  const viewerFriends = viewer ? getFriendIdSet(viewer.id) : new Set<number>();

  const tabs = [
    {
      href: `/profil/${userId}/dostlar`,
      label: dict.publicProfile.friendsHeading,
      count: getFriendCount(userId),
      active: !showFollowers,
    },
    {
      href: `/profil/${userId}/dostlar?tab=obunachilar`,
      label: dict.publicProfile.followersHeading,
      count: getFollowerCount(userId),
      active: showFollowers,
    },
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <Link
        href={viewer?.id === userId ? "/profil" : `/profil/${userId}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {user.name}
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            replace
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              t.active ? "bg-gradient-to-r from-brand-from to-brand-via text-white shadow" : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            <span className={`text-xs ${t.active ? "text-white/80" : "text-muted"}`}>{t.count}</span>
          </Link>
        ))}
      </div>

      {people.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          {showFollowers ? dict.publicProfile.noFollowers : dict.publicProfile.noFriends}
        </p>
      ) : (
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {people.map((person) => (
            <div key={person.id} className="flex items-center gap-3 px-4 py-3">
              <Link
                href={viewer?.id === person.id ? "/profil" : `/profil/${person.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <Avatar name={person.name} color={person.avatarColor} avatarUrl={person.avatarUrl} size={44} />
                <p className="truncate text-sm font-semibold">{person.name}</p>
              </Link>
              {viewer && viewer.id !== person.id && (
                <FriendButton
                  targetId={person.id}
                  initialIsFriend={viewerFriends.has(person.id)}
                  dict={dict}
                  compact
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
