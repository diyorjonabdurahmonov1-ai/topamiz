"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock, MessageCircle, Pause, Play, RotateCw, Sparkles, Tag, Volume2, VolumeX } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { useStartsAtLock } from "@/lib/useStartsAtLock";
import Avatar from "./Avatar";
import LikeButton from "./LikeButton";
import ShareMenu from "./ShareMenu";
import CountdownTimer from "./CountdownTimer";
import { sizedImage } from "@/lib/image-url";

function PhotoMedia({ photoUrls }: { photoUrls: string[] }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="relative h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element -- fills the slide like the <video> it stands in for, not a layout-optimizable asset */}
      <img src={sizedImage(photoUrls[index], 960)} alt="" loading="lazy" className="h-full w-full object-contain" />
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

const CONTROLS_HIDE_MS = 2500;

export default function ReelSlide({
  listing,
  likedByMe,
  active,
  distance,
  loggedIn,
  dict,
  commentCount,
  onOpenComments,
  muted,
  onToggleMuted,
  onSoundBlocked,
}: {
  listing: Listing;
  likedByMe: boolean;
  active: boolean;
  // Position relative to the reel on screen: 0 is the one being watched,
  // 1 the next, -1 the previous.
  distance: number;
  loggedIn: boolean;
  dict: Dictionary;
  commentCount: number;
  onOpenComments: () => void;
  // Lifted to the feed so toggling it on one video applies to every video —
  // Instagram/TikTok-style shared mute state, not a per-slide setting.
  muted: boolean;
  onToggleMuted: () => void;
  // The browser refused to start this video with sound — the feed goes
  // back to muted.
  onSoundBlocked: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = !!listing.videoUrl;
  // Only the reel being watched and its two neighbours get a real <video>:
  // the next one is already buffering when the swipe lands on it, and the
  // rest of the feed costs nothing but a poster — no data and, on low-end
  // phones, no memory held by a dozen decoders.
  const videoMounted = Math.abs(distance) <= 1;
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  // A video that failed before the page hydrated fired its error event with
  // no React listener attached yet — catch that case once it's mounted.
  useEffect(() => {
    if (!videoMounted || !videoRef.current?.error) return;
    const timer = setTimeout(() => setFailed(true));
    return () => clearTimeout(timer);
  }, [videoMounted]);
  // Only a Sirli quti's video can ever be locked — its reveal time is the
  // whole point of the game. Every other listing's video plays normally.
  const locked = useStartsAtLock(listing.isMysteryBox ? listing.startsAt : null);

  useEffect(() => {
    if (!isVideo || locked) return;
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.currentTime = 0;
      video.play().catch((err: unknown) => {
        if ((err as Error)?.name !== "NotAllowedError" || video.muted) return;
        // Playing silently beats not playing at all.
        video.muted = true;
        onSoundBlocked();
        video.play().catch(() => {});
      });
    } else {
      video.pause();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only (re)start on these changes
  }, [active, isVideo, locked]);

  // Tap-to-show controls, TikTok-style: nothing sits on the video while it
  // plays; a tap brings up pause/play and sound buttons, which fade after a
  // moment. While paused they stay up (that also covers a phone that
  // refused to autoplay — the play button is right there).
  const [paused, setPaused] = useState(false);
  const [controlsShown, setControlsShown] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(hideTimer.current), []);
  const controlsVisible = active && !failed && (controlsShown || paused);

  function showControls() {
    setControlsShown(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsShown(false), CONTROLS_HIDE_MS);
  }

  function hideControls() {
    clearTimeout(hideTimer.current);
    setControlsShown(false);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
    showControls();
  }

  function toggleSound() {
    const video = videoRef.current;
    onToggleMuted();
    // Set on the element right away, inside the tap — browsers only allow
    // sound in direct response to one.
    if (video) {
      video.muted = !muted;
      if (video.paused && muted) video.play().catch(() => {});
    }
    showControls();
  }

  const lockBackdropUrl = isVideo ? listing.videoThumbnailUrl : (listing.photoUrls[0] ?? null);

  return (
    <div className="relative h-dvh w-full snap-start overflow-hidden bg-black [scroll-snap-stop:always]">
      {locked ? (
        <div className="relative h-full w-full">
          {lockBackdropUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- hosted on Cloudflare R2 or /api/uploads, not a build-time asset
            <img
              src={lockBackdropUrl}
              alt=""
              className="h-full w-full scale-110 object-cover opacity-50 blur-lg"
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-gold to-brand-via text-white">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {isVideo ? dict.listingDetail.videoLockedTitle : dict.listingDetail.contentLockedTitle}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {isVideo ? dict.listingDetail.videoLockedBody : dict.listingDetail.contentLockedBody}
              </p>
            </div>
            {listing.startsAt && (
              <CountdownTimer expiresAt={listing.startsAt} dict={dict} size="large" mode="starts" />
            )}
          </div>
        </div>
      ) : isVideo && videoMounted ? (
        <>
          <video
            ref={videoRef}
            src={listing.videoUrl ?? undefined}
            poster={listing.videoThumbnailUrl ?? undefined}
            preload={distance === -1 ? "metadata" : "auto"}
            loop
            muted={muted}
            playsInline
            onClick={showControls}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => {
              setBuffering(false);
              setFailed(false);
            }}
            onError={() => {
              setBuffering(false);
              setFailed(true);
            }}
            className="h-full w-full object-contain"
          />
          {active && buffering && !failed && !controlsVisible && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-white/80 drop-shadow" />
            </span>
          )}
          {controlsVisible && (
            // No z-index on purpose: the caption, like and share buttons
            // come later in the page and stay on top of it and tappable.
            <div
              className="animate-fade-in absolute inset-0 flex items-center justify-center gap-6 bg-black/20"
              onClick={() => (paused ? showControls() : hideControls())}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                aria-label={paused ? dict.social.reelPlay : dict.social.reelPause}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-transform active:scale-90"
              >
                {paused ? <Play className="ml-1 h-7 w-7 fill-white" /> : <Pause className="h-7 w-7 fill-white" />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSound();
                }}
                aria-label={muted ? dict.social.reelSoundOn : dict.social.reelSoundOff}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-transform active:scale-90"
              >
                {muted ? <VolumeX className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
              </button>
            </div>
          )}
          {active && failed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-6 text-center">
              <p className="text-sm font-bold text-white">{dict.postListing.videoBgFailed}</p>
              <button
                type="button"
                onClick={() => {
                  const video = videoRef.current;
                  if (!video) return;
                  setFailed(false);
                  setBuffering(true);
                  video.load();
                  video.play().catch(() => {});
                }}
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-900"
              >
                <RotateCw className="h-4 w-4" />
                {dict.postListing.videoRetry}
              </button>
            </div>
          )}
        </>
      ) : isVideo ? (
        listing.videoThumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- R2-hosted poster standing in for a video that isn't loaded yet
          <img src={listing.videoThumbnailUrl} alt="" loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <div className="h-full w-full" />
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



      {/* The caption gradient covers the lower part of the video — let taps
          through it to the video, except on the actual buttons. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pb-8">
        <div className="min-w-0 flex-1 text-white">
          <p className="line-clamp-2 text-sm">{listing.title}</p>
          <Link
            href={`/elonlar/${listing.id}`}
            className="pointer-events-auto mt-2 inline-block rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
          >
            {dict.social.reelsViewListing}
          </Link>
        </div>

        <div className="pointer-events-auto flex shrink-0 flex-col items-center gap-4">
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
