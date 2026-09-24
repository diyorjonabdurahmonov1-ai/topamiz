"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export default function ListingGallery({
  photoUrls,
  title,
  colorFrom,
  colorTo,
  icon,
  dict,
}: {
  photoUrls: string[];
  title: string;
  colorFrom: string;
  colorTo: string;
  // A rendered element, not a component reference — component references
  // (functions) can't be passed as props from a Server Component into a
  // Client Component like this one, but an already-rendered ReactNode can.
  icon: ReactNode;
  dict: Dictionary;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = photoUrls.length;

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, go]);

  // Body scroll lock while the lightbox is open.
  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  if (count === 0) {
    return (
      <div
        className="mt-6 flex h-56 items-center justify-center rounded-2xl sm:h-64"
        style={{ backgroundImage: `linear-gradient(135deg, ${colorFrom}22, ${colorTo}22)` }}
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-xl"
          style={{ backgroundImage: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }}
        >
          {icon}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="group relative h-56 w-full overflow-hidden rounded-2xl bg-surface-2 sm:h-64">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="block h-full w-full cursor-zoom-in"
          aria-label={dict.listingDetail.descriptionLabel}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file served from /api/uploads, not a build-time asset */}
          <img
            src={photoUrls[index]}
            alt={`${title} — ${index + 1}/${count}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </button>

        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Expand"
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/65 group-hover:opacity-100"
        >
          <Expand className="h-4 w-4" />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={dict.common.previous}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/65 group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={dict.common.next}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/65 group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="scrollbar-thin mt-3 flex gap-2 overflow-x-auto pb-1">
          {photoUrls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === index ? "border-brand-via" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file served from /api/uploads, not a build-time asset */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="animate-fade-up fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label={dict.common.close}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label={dict.common.previous}
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label={dict.common.next}
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file served from /api/uploads, not a build-time asset */}
          <img
            src={photoUrls[index]}
            alt={`${title} — ${index + 1}/${count}`}
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {count > 1 && (
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
              {index + 1} / {count}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
