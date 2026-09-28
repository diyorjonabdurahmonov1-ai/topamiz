"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

// A same-page overlay for viewing a single uploaded photo full-size —
// deliberately never a plain `<a target="_blank">` navigation. On an
// installed PWA (especially iOS), target="_blank" breaks out of the
// standalone app into the system browser, which feels like getting thrown
// out of the site entirely rather than just viewing a picture.
export default function PhotoLightbox({
  url,
  onClose,
  dict,
}: {
  url: string;
  onClose: () => void;
  dict: Dictionary;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="animate-fade-up fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={dict.common.close}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file served from /api/uploads, not a build-time asset */}
      <img
        src={url}
        alt=""
        className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
