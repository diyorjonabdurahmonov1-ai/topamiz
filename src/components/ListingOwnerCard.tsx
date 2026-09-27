import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Avatar from "./Avatar";
import FriendButton from "./FriendButton";

export default function ListingOwnerCard({
  ownerId,
  name,
  avatarColor,
  avatarUrl,
  viewerIsOwner,
  viewerIsLoggedIn,
  viewerIsFriend,
  dict,
}: {
  ownerId: number;
  name: string;
  avatarColor: string;
  avatarUrl: string | null;
  viewerIsOwner: boolean;
  viewerIsLoggedIn: boolean;
  viewerIsFriend: boolean;
  dict: Dictionary;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {dict.listingDetail.postedBy}
      </p>
      <Link
        href={`/profil/${ownerId}`}
        className="mt-3 flex items-center gap-3 hover:opacity-90"
      >
        <Avatar name={name} color={avatarColor} avatarUrl={avatarUrl} size={44} />
        <span className="text-sm font-semibold">{name}</span>
      </Link>
      {!viewerIsOwner && (
        <div className="mt-4 flex gap-2">
          <Link
            href={`/xabarlar/${ownerId}`}
            className="btn-brand flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            {dict.publicProfile.writeMessage}
          </Link>
          {viewerIsLoggedIn && (
            <FriendButton targetId={ownerId} initialIsFriend={viewerIsFriend} dict={dict} />
          )}
        </div>
      )}
    </div>
  );
}
