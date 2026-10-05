"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

export default function LikeButton({
  listingId,
  initialLiked,
  initialCount,
  loggedIn,
  variant = "default",
  className = "",
}: {
  listingId: string;
  initialLiked: boolean;
  initialCount: number;
  loggedIn: boolean;
  variant?: "default" | "reel";
  className?: string;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!loggedIn) {
      router.push("/kirish");
      return;
    }
    if (busy) return;
    setBusy(true);
    // Optimistic — a like should feel instant, and a failed request is rare
    // enough to just quietly revert rather than block the tap on a round trip.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    try {
      const res = await fetch(`/api/listings/${listingId}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      setLiked(!nextLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  if (variant === "reel") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex flex-col items-center gap-1 text-white ${className}`}
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
            liked ? "bg-danger/90" : "bg-black/40"
          }`}
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-white" : ""}`} />
        </span>
        <span className="text-xs font-semibold drop-shadow">{count}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
        liked
          ? "border-danger/40 bg-danger/10 text-danger"
          : "border-border text-muted hover:text-foreground"
      } ${className}`}
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-danger" : ""}`} />
      {count}
    </button>
  );
}
