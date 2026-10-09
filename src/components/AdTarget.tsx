"use client";

import { useEffect } from "react";
import type { AdBanner } from "@/lib/ads";

// The clickable (or not) wrapper of an ad. An ad with a link opens it in a
// new tab via /api/ads/[id]/click, which counts the click; an ad without one
// is just a picture — tapping it does nothing.
export default function AdTarget({
  ad,
  className,
  children,
}: {
  ad: AdBanner;
  className: string;
  children: React.ReactNode;
}) {
  if (!ad.linkUrl) return <div className={className}>{children}</div>;
  return (
    <a
      href={`/api/ads/${ad.id}/click`}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      className={className}
    >
      {children}
    </a>
  );
}

const reported = new Set<number>();

// Reports that an ad has been on screen — once per ad per page load (the
// server also ignores repeats from the same visitor for a while).
export function useAdView(adId: number | undefined) {
  useEffect(() => {
    if (adId === undefined || reported.has(adId) || document.visibilityState !== "visible") return;
    reported.add(adId);
    fetch(`/api/ads/${adId}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [adId]);
}
