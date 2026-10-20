import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getCurrentUser, getPublicUserById, getUserById, isAdmin, isUserBlocked } from "@/lib/auth";
import { getListingsByOwner } from "@/lib/listings";
import { getFollowerCount, getFriendCount, isFriend } from "@/lib/friends";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import Avatar from "@/components/Avatar";
import ListingsGrid from "@/components/ListingsGrid";
import FriendButton from "@/components/FriendButton";
import FriendCounts from "@/components/FriendCounts";
import UserSafetyMenu from "@/components/UserSafetyMenu";
import { hasBlocked } from "@/lib/user-blocks";

export async function generateMetadata(props: PageProps<"/profil/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const user = getPublicUserById(Number(id));
  return { title: user ? `${user.name} — Findo` : "Foydalanuvchi topilmadi — Findo" };
}

export default async function PublicProfilePage(props: PageProps<"/profil/[id]">) {
  const { id } = await props.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) notFound();

  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.id === userId) redirect("/profil");

  const user = getUserById(userId);
  // A blocked user's profile is gone for everyone but admins.
  if (!user || (isUserBlocked(userId) && !isAdmin(currentUser))) notFound();
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const listings = getListingsByOwner(user.id)
    .filter((l) => l.status === "active")
    .filter((l) => currentUser || !l.isMysteryBox);
  const friendCount = getFriendCount(user.id);
  const followerCount = getFollowerCount(user.id);
  const viewerIsFriend = currentUser ? isFriend(currentUser.id, user.id) : false;
  // Blocked by this viewer: the profile stays reachable (to unblock), but
  // their listings and the message button don't show.
  const iBlocked = currentUser ? hasBlocked(currentUser.id, user.id) : false;
  const showMenu = !!currentUser && !isAdmin(user);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="relative mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center">
        {showMenu && (
          <UserSafetyMenu
            userId={user.id}
            userName={user.name}
            blocked={iBlocked}
            context="profile"
            dict={dict}
            className="absolute right-3 top-3"
          />
        )}
        <Avatar name={user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} size={88} />
        <h1 className="mt-4 text-xl font-extrabold">{user.name}</h1>
        <p className="mt-3 max-w-sm text-sm text-muted">{user.bio || dict.publicProfile.noBio}</p>

        <FriendCounts
          userId={user.id}
          friendCount={friendCount}
          followerCount={followerCount}
          locale={locale}
          className="mt-4"
        />

        {iBlocked ? (
          <p className="mt-6 w-full rounded-xl bg-surface-2 px-4 py-3 text-sm font-medium text-muted">
            {dict.safety.blockedProfile}
          </p>
        ) : (
          <div className="mt-6 flex w-full gap-2">
            <Link
              href={`/xabarlar/${user.id}`}
              className="btn-brand flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            >
              <MessageCircle className="h-4 w-4" />
              {dict.publicProfile.writeMessage}
            </Link>
            {currentUser && (
              <FriendButton targetId={user.id} initialIsFriend={viewerIsFriend} dict={dict} />
            )}
          </div>
        )}
      </div>

      {!iBlocked && (
        <div className="mt-10">
          <h2 className="text-lg font-bold">{dict.publicProfile.listingsHeading}</h2>
          {listings.length > 0 ? (
            <div className="mt-4">
              <ListingsGrid listings={listings} dict={dict} locale={locale} />
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
              {dict.publicProfile.noListings}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
