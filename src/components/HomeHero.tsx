"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { AdBanner } from "@/lib/ads";
import type { Dictionary } from "@/lib/i18n";

const ROTATE_MS = 5000;
// After someone swipes or taps the banner, leave it where they put it for a while.
const PAUSE_AFTER_TOUCH_MS = 10_000;

// The home page's top banner is the site's ad slot: active ads (managed at
// /admin/reklama) rotate here one after another; with none running it shows
// the default welcome banner instead.
export default function HomeHero({ ads, dict }: { ads: AdBanner[]; dict: Dictionary }) {
  if (ads.length === 0) return <WelcomeBanner dict={dict} />;
  return <AdCarousel ads={ads} dict={dict} />;
}

function AdCarousel({ ads, dict }: { ads: AdBanner[]; dict: Dictionary }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const pausedUntil = useRef(0);

  const goTo = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil.current || document.visibilityState !== "visible") return;
      const el = scrollerRef.current;
      if (!el) return;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      goTo((current + 1) % ads.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [ads.length, goTo]);

  const pause = () => {
    pausedUntil.current = Date.now() + PAUSE_AFTER_TOUCH_MS;
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        onPointerDown={pause}
        onWheel={pause}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl shadow-xl shadow-brand-via/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ads.map((ad) => (
          <a
            key={ad.id}
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="relative block aspect-[12/5] w-full shrink-0 snap-center overflow-hidden bg-surface-2 lg:aspect-[16/5]"
          >
            {ad.mediaType === "video" ? (
              <video src={ad.mediaUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded ad media (may be an animated GIF), not a build-time asset
              <img src={ad.mediaUrl} alt={ad.title || dict.ads.fallbackAlt} className="h-full w-full object-cover" />
            )}
            <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              {dict.nav.ads}
            </span>
            {ad.title && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-sm font-bold text-white">
                <span className="line-clamp-1">{ad.title}</span>
              </span>
            )}
          </a>
        ))}
      </div>

      {ads.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {ads.map((ad, i) => (
            <button
              key={ad.id}
              type="button"
              aria-label={`${i + 1} / ${ads.length}`}
              onClick={() => {
                pause();
                goTo(i);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-brand-via" : "w-1.5 bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WelcomeBanner({ dict }: { dict: Dictionary }) {
  const t = dict.homeQuickAccess;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-from via-brand-via to-[#8b5cf6] p-5 text-white shadow-xl shadow-brand-via/25 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-brand-to/30 blur-3xl" />
      <MapIllustration className="pointer-events-none absolute -right-4 bottom-0 h-full w-[46%] max-w-[260px] sm:right-4" />

      <div className="relative max-w-[62%] sm:max-w-md">
        <h1 className="text-[19px] font-extrabold leading-tight tracking-tight sm:text-3xl">{t.heroTitle}</h1>
        <p className="mt-2 text-xs leading-relaxed text-white/80 sm:text-sm">{t.heroSubtitle}</p>
        <Link
          href="/elon-qoshish"
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white py-2 pl-2 pr-4 text-sm font-bold text-gray-900 shadow-lg transition-transform active:scale-95"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-from to-brand-via text-white">
            <Plus className="h-4 w-4" strokeWidth={3} />
          </span>
          {t.heroCta}
        </Link>
      </div>
    </div>
  );
}

// A map tile with a dotted route and location pins — drawn inline so the
// banner needs no image asset and stays crisp at any size.
function MapIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="hero-pin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="hero-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path d="M30 150 L120 110 L230 140 L140 190 Z" fill="url(#hero-tile)" stroke="#ffffff" strokeOpacity="0.35" />
      <path d="M75 130 L185 165 M95 121 L120 182 M150 122 L175 176" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
      <path
        d="M40 70 C 70 110, 110 90, 132 128"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.7"
        strokeWidth="2.5"
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
      <path d="M180 60 C 200 90, 175 110, 150 128" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round" />
      <ellipse cx="132" cy="150" rx="26" ry="8" fill="#1e1b4b" opacity="0.35" />
      <path d="M132 150 C 112 122, 102 108, 102 92 a30 30 0 1 1 60 0 c0 16 -10 30 -30 58 z" fill="url(#hero-pin)" stroke="#c7d2fe" strokeWidth="2" />
      <circle cx="132" cy="92" r="12" fill="#ffffff" />
      <g opacity="0.95">
        <path d="M40 74 c-8 -11 -12 -17 -12 -23 a12 12 0 1 1 24 0 c0 6 -4 12 -12 23 z" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="40" cy="51" r="4.5" fill="#ffffff" />
        <path d="M184 64 c-8 -11 -12 -17 -12 -23 a12 12 0 1 1 24 0 c0 6 -4 12 -12 23 z" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="184" cy="41" r="4.5" fill="#ffffff" />
      </g>
    </svg>
  );
}
