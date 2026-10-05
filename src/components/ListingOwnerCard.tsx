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
    <div>
      <div className="flex items-center justify-between gap-3">
        <Link href={`/profil/${ownerId}`} className="flex min-w-0 items-center gap-2.5 hover:opacity-90">
          <Avatar name={name} color={avatarColor} avatarUrl={avatarUrl} size={40} />
          <span className="truncate text-sm font-bold">{name}</span>
        </Link>
        {!viewerIsOwner && (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/xabarlar/${ownerId}`}
              aria-label={dict.publicProfile.writeMessage}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
            {viewerIsLoggedIn && (
              <FriendButton targetId={ownerId} initialIsFriend={viewerIsFriend} dict={dict} compact />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
