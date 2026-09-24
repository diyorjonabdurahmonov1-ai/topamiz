"use client";

import { useState } from "react";
import Image from "next/image";

// Retry-on-error safety net for any genuine transient load failure, kept
// alongside `priority` (set by the caller for the first photo) since that's
// what actually fixes the real issue: default lazy-loading defers the
// fetch until an intersection-observer callback fires, and on this page the
// photo is the entire reason a visitor is here — it shouldn't wait on that.
export default function TagPhoto({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="h-full w-full bg-surface-2" aria-label={alt} />;
  }

  return (
    <Image
      key={attempt}
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 640px) 50vw, 200px"
      className="object-cover"
      onError={() => {
        if (attempt === 0) setAttempt(1);
        else setFailed(true);
      }}
    />
  );
}
