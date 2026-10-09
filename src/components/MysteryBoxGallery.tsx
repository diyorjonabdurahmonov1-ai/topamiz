"use client";

import type { ReactNode } from "react";
import { useStartsAtLock } from "@/lib/useStartsAtLock";
import type { Dictionary } from "@/lib/i18n";
import ListingGallery from "./ListingGallery";
import { sizedImage } from "@/lib/image-url";

// Before a Sirli quti's reveal time, its photos stay blurred and
// non-interactive (no lightbox) — a teaser rather than a real look,
// matching how its video stays locked behind the same countdown.
export default function MysteryBoxGallery({
  startsAt,
  photoUrls,
  title,
  colorFrom,
  colorTo,
  icon,
  dict,
}: {
  startsAt: string;
  photoUrls: string[];
  title: string;
  colorFrom: string;
  colorTo: string;
  icon: ReactNode;
  dict: Dictionary;
}) {
  const locked = useStartsAtLock(startsAt);

  if (locked && photoUrls.length > 0) {
    return (
      <div className="relative mt-6 h-56 w-full overflow-hidden rounded-2xl bg-surface-2 sm:h-64">
        {/* eslint-disable-next-line @next/next/no-img-element -- runtime-uploaded file served from /api/uploads, not a build-time asset */}
        <img src={sizedImage(photoUrls[0], 240)} alt="" className="h-full w-full scale-110 object-cover blur-xl" />
        <div className="absolute inset-0 bg-black/35" />
      </div>
    );
  }

  return (
    <ListingGallery
      photoUrls={photoUrls}
      title={title}
      colorFrom={colorFrom}
      colorTo={colorTo}
      icon={icon}
      dict={dict}
    />
  );
}
