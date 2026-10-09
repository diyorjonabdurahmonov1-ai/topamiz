import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { formatFollowersCount, formatFriendsCount } from "@/lib/i18n/format";

// Adding someone is one-way, like following: "friends" are the people this
// user added, "followers" the people who added them. Showing both is what
// makes an add visible to the person being added.
export default function FriendCounts({
  userId,
  friendCount,
  followerCount,
  locale,
  className = "",
}: {
  userId: number;
  friendCount: number;
  followerCount: number;
  locale: Locale;
  className?: string;
}) {
  const pill =
    "flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-4 py-1.5 text-sm font-semibold hover:bg-surface-2";
  return (
    <div className={`flex flex-wrap justify-center gap-2 ${className}`}>
      <Link href={`/profil/${userId}/dostlar`} className={pill}>
        {formatFriendsCount(locale, friendCount)}
      </Link>
      <Link href={`/profil/${userId}/dostlar?tab=obunachilar`} className={pill}>
        {formatFollowersCount(locale, followerCount)}
      </Link>
    </div>
  );
}
