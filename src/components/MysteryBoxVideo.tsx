"use client";

import { Lock } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { useStartsAtLock } from "@/lib/useStartsAtLock";
import CountdownTimer from "./CountdownTimer";

// A Sirli quti's video stays locked behind a blurred poster + countdown
// until its creator-chosen reveal time — everything else about the
// listing (description, photos, location) is visible right away, only the
// video itself is part of the game.
export default function MysteryBoxVideo({
  videoUrl,
  thumbnailUrl,
  startsAt,
  dict,
}: {
  videoUrl: string;
  thumbnailUrl: string | null;
  startsAt: string | null;
  dict: Dictionary;
}) {
  const locked = useStartsAtLock(startsAt);

  if (locked && startsAt) {
    return (
      <div className="relative aspect-[9/16] max-h-[70vh] w-full overflow-hidden sm:aspect-video sm:max-h-[480px]">
        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- hosted on Cloudflare R2, not a build-time asset
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-50 blur-lg"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-gold to-brand-via text-white">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{dict.listingDetail.videoLockedTitle}</p>
            <p className="mt-1 text-xs text-white/70">{dict.listingDetail.videoLockedBody}</p>
          </div>
          <CountdownTimer expiresAt={startsAt} dict={dict} size="large" mode="starts" />
        </div>
      </div>
    );
  }

  return (
    <video
      src={videoUrl}
      poster={thumbnailUrl ?? undefined}
      controls
      playsInline
      className="aspect-[9/16] w-full max-h-[70vh] bg-black object-contain sm:aspect-video sm:max-h-[480px]"
    />
  );
}
