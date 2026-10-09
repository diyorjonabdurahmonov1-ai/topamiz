"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clapperboard } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import ReelSlide from "./ReelSlide";
import ReelCommentsSheet from "./ReelCommentsSheet";

type ReelListing = Listing & { likedByMe: boolean };

export default function ReelsFeed({
  initialListings,
  loggedIn,
  dict,
}: {
  initialListings: ReelListing[];
  loggedIn: boolean;
  dict: Dictionary;
}) {
  const [listings, setListings] = useState(initialListings);
  const [activeId, setActiveId] = useState(initialListings[0]?.id ?? null);
  const activeIndex = Math.max(0, listings.findIndex((l) => l.id === activeId));
  // Shared across every slide rather than per-video — unmuting one video
  // should unmute the whole feed, and vice versa, matching how a single tap
  // on Instagram/TikTok's mute button affects every reel from then on.
  const [muted, setMuted] = useState(true);
  useReelSound(setMuted);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialListings.map((l) => [l.id, l.commentCount]))
  );
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const excludeIds = listings.map((l) => l.id).join(",");
      const res = await fetch(`/api/reels?exclude=${excludeIds}`);
      if (res.ok) {
        const data = await res.json();
        if (data.listings.length > 0) {
          setListings((prev) => [...prev, ...data.listings]);
          setCommentCounts((prev) => ({
            ...prev,
            ...Object.fromEntries(data.listings.map((l: ReelListing) => [l.id, l.commentCount])),
          }));
        }
      }
    } finally {
      setLoadingMore(false);
    }
  }, [listings, loadingMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const id = entry.target.getAttribute("data-listing-id");
            if (id) setActiveId(id);
          }
        }
      },
      { root: container, threshold: [0.6] }
    );

    slideRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [listings]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function onScroll() {
      if (!container) return;
      const nearEnd = container.scrollTop + container.clientHeight >= container.scrollHeight - container.clientHeight;
      if (nearEnd) loadMore();
    }
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [loadMore]);

  if (listings.length === 0) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-black px-6 text-center text-white">
        <Clapperboard className="h-10 w-10 text-muted" />
        <p className="text-sm font-bold">{dict.social.reelsEmptyTitle}</p>
        <p className="max-w-xs text-sm text-muted">{dict.social.reelsEmptyBody}</p>
        <Link href="/" className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-brand-via">
          <ArrowLeft className="h-4 w-4" />
          {dict.listingDetail.backLink}
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-dvh w-full snap-y snap-mandatory overflow-y-scroll bg-black"
    >
      {listings.map((listing, i) => (
        <div
          key={listing.id}
          data-listing-id={listing.id}
          ref={(el) => {
            if (el) slideRefs.current.set(listing.id, el);
            else slideRefs.current.delete(listing.id);
          }}
        >
          <ReelSlide
            listing={listing}
            likedByMe={listing.likedByMe}
            active={activeId === listing.id}
            distance={i - activeIndex}
            loggedIn={loggedIn}
            dict={dict}
            commentCount={commentCounts[listing.id] ?? listing.commentCount}
            onOpenComments={() => setOpenCommentsFor(listing.id)}
            muted={muted}
            onToggleMuted={() => {
              setMuted(!muted);
              rememberSound(muted);
            }}
            onSoundBlocked={() => setMuted(true)}
          />
        </div>
      ))}

      {openCommentsFor && (
        <ReelCommentsSheet
          key={openCommentsFor}
          listingId={openCommentsFor}
          loggedIn={loggedIn}
          dict={dict}
          onClose={() => setOpenCommentsFor(null)}
          onCommentPosted={(count) =>
            setCommentCounts((prev) => ({ ...prev, [openCommentsFor]: count }))
          }
        />
      )}
    </div>
  );
}

const SOUND_KEY = "findo-reels-sound";
const VOLUME_KEYS = new Set(["AudioVolumeUp", "AudioVolumeDown", "VolumeUp", "VolumeDown"]);

function rememberSound(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // Private mode — the choice just isn't remembered.
  }
}

function soundWanted(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) === "on";
  } catch {
    return false;
  }
}

// Instagram-style sound: reels start muted (browsers block sound before the
// visitor has touched the page), and then
// - one tap on a muted video turns sound on (see ReelSlide);
// - a volume key turns it on too, but only where the browser passes those
//   keys to the page (desktop keyboards) — Chrome on Android and Safari on
//   iOS keep the phone's hardware buttons to themselves;
// - once sound has been turned on it stays on — for the next reels and the
//   next visit — starting right away when the browser allows it (arriving
//   from a tap elsewhere on the site) or at the first tap otherwise.
function useReelSound(setMuted: (muted: boolean) => void) {
  useEffect(() => {
    const unmute = () => {
      setMuted(false);
      rememberSound(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (VOLUME_KEYS.has(e.key)) unmute();
    };
    window.addEventListener("keydown", onKey);

    let onFirstTap: ((e: MouseEvent) => void) | null = null;
    if (soundWanted()) {
      const activated = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
        ?.hasBeenActive;
      if (activated) {
        void Promise.resolve().then(() => setMuted(false));
      } else {
        // A tap (not a swipe — the browser only treats a tap as the go-ahead
        // for sound) brings the sound back. Caught before it reaches the
        // video, so that tap doesn't also pause it.
        onFirstTap = (e: MouseEvent) => {
          setMuted(false);
          if ((e.target as Element | null)?.closest("video")) e.stopPropagation();
        };
        window.addEventListener("click", onFirstTap, { capture: true, once: true });
      }
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      if (onFirstTap) window.removeEventListener("click", onFirstTap, { capture: true });
    };
  }, [setMuted]);
}
