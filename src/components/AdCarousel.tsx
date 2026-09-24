"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdBanner } from "@/lib/ads";
import type { Dictionary } from "@/lib/i18n";

const ROTATE_MS = 5000;

export default function AdCarousel({ ads, dict }: { ads: AdBanner[]; dict: Dictionary }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (ads.length <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, ROTATE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ads.length, paused]);

  if (ads.length === 0) return null;

  const safeIndex = index % ads.length;
  const ad = ads[safeIndex];

  function go(delta: number) {
    setIndex((i) => (i + delta + ads.length) % ads.length);
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="block h-28 w-full sm:h-36"
      >
        {ad.mediaType === "video" ? (
          <video
            key={ad.id}
            src={ad.mediaUrl}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded ad media (may be an animated GIF), not a fixed local asset
          <img src={ad.mediaUrl} alt={ad.title || dict.ads.fallbackAlt} className="h-full w-full object-cover" />
        )}
      </a>

      {ad.title && (
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {ad.title}
        </span>
      )}

      {ads.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={dict.ads.previousAria}
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={dict.ads.nextAria}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {ads.map((a, i) => (
              <span
                key={a.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === safeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
