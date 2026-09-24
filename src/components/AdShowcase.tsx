"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdBanner } from "@/lib/ads";
import type { Dictionary } from "@/lib/i18n";

export default function AdShowcase({ ads, dict }: { ads: AdBanner[]; dict: Dictionary }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (ads.length === 0) return null;

  function scrollByAmount(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  function scrollToIndex(i: number) {
    const el = scrollerRef.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    let closest = 0;
    let minDist = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const dist = Math.abs((child as HTMLElement).offsetLeft - el.offsetLeft - el.scrollLeft);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }

  return (
    <div className="group/row relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="scrollbar-thin -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      >
        {ads.map((ad) => (
          <a
            key={ad.id}
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="card-hover w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-surface sm:w-72 lg:w-80"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
              {ad.mediaType === "video" ? (
                <video
                  src={ad.mediaUrl}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded ad media (may be an animated GIF), not a build-time asset
                <img
                  src={ad.mediaUrl}
                  alt={ad.title || dict.ads.fallbackAlt}
                  className="h-full w-full object-cover"
                />
              )}
              <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-gray-900 backdrop-blur-sm">
                {dict.nav.ads}
              </span>
            </div>
            {ad.title && (
              <p className="line-clamp-2 px-3.5 py-3 text-sm font-semibold leading-snug text-foreground">
                {ad.title}
              </p>
            )}
          </a>
        ))}
      </div>

      {ads.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollByAmount(-1)}
            aria-label={dict.common.previous}
            className="absolute left-1 top-[38%] hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 p-2 text-foreground opacity-0 shadow-lg backdrop-blur transition-opacity hover:bg-surface-2 group-hover/row:opacity-100 lg:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(1)}
            aria-label={dict.common.next}
            className="absolute right-1 top-[38%] hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 p-2 text-foreground opacity-0 shadow-lg backdrop-blur transition-opacity hover:bg-surface-2 group-hover/row:opacity-100 lg:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mt-1 flex justify-center gap-1.5">
            {ads.map((ad, i) => (
              <button
                key={ad.id}
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex ? "w-4 bg-brand-via" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
