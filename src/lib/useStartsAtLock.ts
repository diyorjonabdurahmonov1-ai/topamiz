"use client";

import { useEffect, useState } from "react";

// Tracks whether a Sirli quti's video reveal time is still in the future.
// Ticks every second so the UI flips from locked to unlocked on its own,
// without a page reload, the moment `startsAt` passes.
export function useStartsAtLock(startsAt: string | null): boolean {
  const [locked, setLocked] = useState(() => !!startsAt && new Date(startsAt).getTime() > Date.now());

  useEffect(() => {
    if (!startsAt || !locked) return;
    const id = setInterval(() => {
      if (new Date(startsAt).getTime() <= Date.now()) setLocked(false);
    }, 1000);
    return () => clearInterval(id);
  }, [startsAt, locked]);

  return locked;
}
