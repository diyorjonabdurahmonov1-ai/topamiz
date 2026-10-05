"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Volume2, VolumeX } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import Avatar from "./Avatar";
import LikeButton from "./LikeButton";
import ShareMenu from "./ShareMenu";

export default function ReelSlide({
  listing,
  likedByMe,
  active,
  loggedIn,
  dict,
  commentCount,
  onOpenComments,
}: {
  listing: Listing;
  likedByMe: boolean;
  active: boolean;
  loggedIn: boolean;
  dict: Dictionary;
  commentCount: number;
  onOpenComments: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full snap-start overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={listing.videoUrl ?? undefined}
        poster={listing.videoThumbnailUrl ?? undefined}
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        className="h-full w-full object-contain"
      />

      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pb-20">
        <div className="min-w-0 flex-1 text-white">
          {listing.ownerId && listing.ownerName && (
            <Link href={`/profil/${listing.ownerId}`} className="flex items-center gap-2">
              <Avatar
                name={listing.ownerName}
                color={listing.ownerAvatarColor ?? "#6366f1"}
                avatarUrl={listing.ownerAvatarUrl}
                size={28}
              />
              <span className="text-sm font-bold">{listing.ownerName}</span>
            </Link>
          )}
          <p className="mt-2 line-clamp-2 text-sm">{listing.title}</p>
          <Link
            href={`/elonlar/${listing.id}`}
            className="mt-2 inline-block rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
          >
            {dict.social.reelsViewListing}
          </Link>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-4">
          <LikeButton
            listingId={listing.id}
            initialLiked={likedByMe}
            initialCount={listing.likeCount}
            loggedIn={loggedIn}
            variant="reel"
          />
          <button type="button" onClick={onOpenComments} className="flex flex-col items-center gap-1 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold drop-shadow">{commentCount}</span>
          </button>
          <ShareMenu listingId={listing.id} title={listing.title} loggedIn={loggedIn} dict={dict} variant="reel" />
        </div>
      </div>
    </div>
  );
}
