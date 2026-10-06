"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, MessageCircle, Sparkles, Tag, Volume2, VolumeX } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { useStartsAtLock } from "@/lib/useStartsAtLock";
import Avatar from "./Avatar";
import LikeButton from "./LikeButton";
import ShareMenu from "./ShareMenu";
import CountdownTimer from "./CountdownTimer";

function PhotoMedia({ photoUrls }: { photoUrls: string[] }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="relative h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element -- fills the slide like the <video> it stands in for, not a layout-optimizable asset */}
      <img src={photoUrls[index]} alt="" className="h-full w-full object-contain" />
      {photoUrls.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Oldingi rasm"
            onClick={() => setIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length)}
            className="absolute inset-y-0 left-0 w-1/3"
          />
          <button
            type="button"
            aria-label="Keyingi rasm"
            onClick={() => setIndex((i) => (i + 1) % photoUrls.length)}
            className="absolute inset-y-0 right-0 w-1/3"
          />
          <div className="absolute inset-x-4 top-[calc(3.75rem+env(safe-area-inset-top))] flex gap-1">
            {photoUrls.map((_, i) => (
              <span
                key={i}
                className={`h-0.5 flex-1 rounded-full ${i === index ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ReelSlide({
  listing,
  likedByMe,
  active,
  loggedIn,
  dict,
  commentCount,
  onOpenComments,
  muted,
  onToggleMuted,
}: {
  listing: Listing;
  likedByMe: boolean;
  active: boolean;
  loggedIn: boolean;
  dict: Dictionary;
  commentCount: number;
  onOpenComments: () => void;
  // Lifted to the feed so toggling it on one video applies to every video —
  // Instagram/TikTok-style shared mute state, not a per-slide setting.
  muted: boolean;
  onToggleMuted: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = !!listing.videoUrl;
  // Only a Sirli quti's video can ever be locked — its reveal time is the
  // whole point of the game. Every other listing's video plays normally.
  const locked = useStartsAtLock(listing.isMysteryBox ? listing.startsAt : null);

  useEffect(() => {
    if (!isVideo || locked) return;
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active, isVideo, locked]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  return (
    <div className="relative h-dvh w-full snap-start overflow-hidden bg-black [scroll-snap-stop:always]">
      {isVideo ? (
        locked ? (
          <div className="relative h-full w-full">
            {listing.videoThumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- hosted on Cloudflare R2, not a build-time asset
              <img
                src={listing.videoThumbnailUrl}
                alt=""
                className="h-full w-full scale-110 object-cover opacity-50 blur-lg"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-gold to-brand-via text-white">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{dict.listingDetail.videoLockedTitle}</p>
                <p className="mt-1 text-xs text-white/70">{dict.listingDetail.videoLockedBody}</p>
              </div>
              {listing.startsAt && (
                <CountdownTimer expiresAt={listing.startsAt} dict={dict} size="large" mode="starts" />
              )}
            </div>
          </div>
        ) : (
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
        )
      ) : (
        <PhotoMedia photoUrls={listing.photoUrls} />
      )}

      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 bg-gradient-to-b from-black/70 to-transparent p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Link
          href="/"
          aria-label={dict.listingDetail.backLink}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {listing.ownerId && listing.ownerName && (
          <Link href={`/profil/${listing.ownerId}`} className="flex min-w-0 items-center gap-2 text-white">
            <Avatar
              name={listing.ownerName}
              color={listing.ownerAvatarColor ?? "#6366f1"}
              avatarUrl={listing.ownerAvatarUrl}
              size={32}
            />
            <span className="truncate text-sm font-bold drop-shadow">{listing.ownerName}</span>
          </Link>
        )}
      </div>

      {(listing.isMysteryBox || listing.isPromo) && (
        <span
          className={`absolute left-4 top-[calc(4.25rem+env(safe-area-inset-top))] z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow ${
            listing.isMysteryBox
              ? "bg-gradient-to-r from-accent-gold to-brand-via"
              : "bg-gradient-to-r from-sky-500 to-brand-via"
          }`}
        >
          {listing.isMysteryBox ? (
            <Sparkles className="h-3 w-3" />
          ) : (
            <Tag className="h-3 w-3" />
          )}
          {listing.isMysteryBox ? dict.listingCard.mysteryBox : dict.listingCard.promo}
        </span>
      )}

      {isVideo && !locked && (
        <button
          type="button"
          onClick={onToggleMuted}
          aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
          className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pb-8">
        <div className="min-w-0 flex-1 text-white">
          <p className="line-clamp-2 text-sm">{listing.title}</p>
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
          <button
            type="button"
            onClick={onOpenComments}
            className="flex flex-col items-center gap-1 text-white transition-transform active:scale-90"
          >
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
