"use client";

import { Lock } from "lucide-react";
import { useStartsAtLock } from "@/lib/useStartsAtLock";
import type { Dictionary } from "@/lib/i18n";
import CountdownTimer from "./CountdownTimer";

// Mirrors the expiry countdown shown above it, but for the reveal time —
// explains what the countdown below (location hidden, photos blurred) is
// counting down to, even on a Sirli quti with no video.
export default function MysteryBoxStartNotice({ startsAt, dict }: { startsAt: string; dict: Dictionary }) {
  const locked = useStartsAtLock(startsAt);
  if (!locked) return null;
  return (
    <div className="mt-4 space-y-2">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-gold">
        <Lock className="h-4 w-4" />
        {dict.listingDetail.contentLockedTitle}
      </p>
      <CountdownTimer expiresAt={startsAt} dict={dict} size="large" mode="starts" />
    </div>
  );
}
