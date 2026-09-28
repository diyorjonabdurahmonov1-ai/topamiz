"use client";

import { useEffect, useState } from "react";
import { Hourglass } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

interface Remaining {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getRemaining(expiresAt: string): Remaining {
  const total = new Date(expiresAt).getTime() - Date.now();
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
  };
}

// Computed only on the client (starting from `null`) rather than during the
// initial render, so the server-rendered markup never has to guess "now" —
// avoids a hydration mismatch on the seconds digit.
export default function CountdownTimer({
  expiresAt,
  dict,
  size = "large",
}: {
  expiresAt: string;
  dict: Dictionary;
  size?: "compact" | "large";
}) {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(expiresAt));
    const timeoutId = setTimeout(tick, 0);
    const intervalId = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [expiresAt]);

  if (!remaining) return null;

  if (remaining.total <= 0) {
    return size === "compact" ? (
      <span className="absolute right-1.5 top-1.5 rounded-full bg-bg/80 px-2 py-0.5 text-[10px] font-semibold text-muted shadow">
        {dict.countdown.expired}
      </span>
    ) : (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-semibold text-muted">
        <Hourglass className="h-4 w-4" />
        {dict.countdown.expired}
      </div>
    );
  }

  if (size === "compact") {
    const label =
      remaining.days > 0
        ? `${remaining.days}${dict.countdown.days} ${remaining.hours}${dict.countdown.hours}`
        : remaining.hours > 0
          ? `${remaining.hours}${dict.countdown.hours} ${remaining.minutes}${dict.countdown.minutes}`
          : `${remaining.minutes}${dict.countdown.minutes} ${remaining.seconds}${dict.countdown.seconds}`;
    return (
      <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-gold to-brand-via px-2 py-0.5 text-[10px] font-semibold text-white shadow">
        <Hourglass className="h-3 w-3" />
        {label}
      </span>
    );
  }

  const units = [
    { value: remaining.days, label: dict.countdown.days },
    { value: remaining.hours, label: dict.countdown.hours },
    { value: remaining.minutes, label: dict.countdown.minutes },
    { value: remaining.seconds, label: dict.countdown.seconds },
  ];

  return (
    <div className="rounded-2xl border border-accent-gold/30 bg-gradient-to-br from-accent-gold/10 via-brand-via/5 to-transparent p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-accent-gold">
        <Hourglass className="h-3.5 w-3.5" />
        {dict.countdown.label}
      </p>
      <div className="mt-2 flex gap-4">
        {units.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <span className="text-xl font-extrabold tabular-nums">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
