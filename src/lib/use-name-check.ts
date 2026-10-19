"use client";

import { useEffect, useState } from "react";

export type NameCheck = "idle" | "checking" | "available" | "taken" | "invalid";

const DEBOUNCE_MS = 450;

// Checks a profile name against everyone else's as it's typed: once the
// typing pauses, asks /api/name-check. `unchanged` is the name the person
// already has (the profile editor), which needs no check. A failed request
// reads as "idle" — the server checks again on submit anyway.
export function useNameCheck(name: string, unchanged?: string): NameCheck {
  const trimmed = name.trim();
  const skip = trimmed.length < 2 || trimmed === unchanged?.trim();
  const [result, setResult] = useState<{ name: string; status: NameCheck }>({ name: "", status: "idle" });

  useEffect(() => {
    if (skip) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/name-check?name=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { available: boolean; code: string | null };
        setResult({
          name: trimmed,
          status: data.available ? "available" : data.code === "nameTaken" ? "taken" : "invalid",
        });
      } catch {
        if (!controller.signal.aborted) setResult({ name: trimmed, status: "idle" });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, skip]);

  if (skip) return "idle";
  // An answer for an older spelling doesn't count: still checking this one.
  return result.name === trimmed ? result.status : "checking";
}
