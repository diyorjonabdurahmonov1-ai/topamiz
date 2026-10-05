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
      <div className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-3 bg-black px-6 text-center text-white">
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
      className="h-[calc(100dvh-4rem)] w-full snap-y snap-mandatory overflow-y-scroll bg-black"
    >
      {listings.map((listing) => (
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
            loggedIn={loggedIn}
            dict={dict}
            commentCount={commentCounts[listing.id] ?? listing.commentCount}
            onOpenComments={() => setOpenCommentsFor(listing.id)}
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
