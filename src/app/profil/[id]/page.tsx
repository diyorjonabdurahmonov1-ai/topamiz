import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { getListingsByOwner } from "@/lib/listings";
import { getFriendCount, isFriend } from "@/lib/friends";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { formatFriendsCount } from "@/lib/i18n/format";
import Avatar from "@/components/Avatar";
import ListingsGrid from "@/components/ListingsGrid";
import FriendButton from "@/components/FriendButton";

export async function generateMetadata(props: PageProps<"/profil/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const user = getUserById(Number(id));
  return { title: user ? `${user.name} — Findo` : "Foydalanuvchi topilmadi — Findo" };
}

export default async function PublicProfilePage(props: PageProps<"/profil/[id]">) {
  const { id } = await props.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) notFound();

  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.id === userId) redirect("/profil");

  const user = getUserById(userId);
  if (!user) notFound();
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const listings = getListingsByOwner(user.id)
    .filter((l) => l.status === "active")
    .filter((l) => currentUser || !l.isMysteryBox);
  const friendCount = getFriendCount(user.id);
  const viewerIsFriend = currentUser ? isFriend(currentUser.id, user.id) : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center">
        <Avatar name={user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} size={88} />
        <h1 className="mt-4 text-xl font-extrabold">{user.name}</h1>
        <p className="mt-3 max-w-sm text-sm text-muted">{user.bio || dict.publicProfile.noBio}</p>

        <Link
          href={`/profil/${user.id}/dostlar`}
          className="mt-4 flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-4 py-1.5 text-sm font-semibold hover:bg-surface-2"
        >
          {formatFriendsCount(locale, friendCount)}
        </Link>

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
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold">{dict.publicProfile.listingsHeading}</h2>
        {listings.length > 0 ? (
          <div className="mt-4">
            <ListingsGrid listings={listings} dict={dict} />
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            {dict.publicProfile.noListings}
          </p>
        )}
      </div>
    </div>
  );
}
