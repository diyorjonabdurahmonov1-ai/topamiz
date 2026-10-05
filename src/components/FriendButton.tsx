"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export default function FriendButton({
  targetId,
  initialIsFriend,
  dict,
  compact = false,
}: {
  targetId: number;
  initialIsFriend: boolean;
  dict: Dictionary;
  // Icon-only, sized to sit next to the message button in a tight header
  // row (e.g. the listing page's Instagram-style owner line) instead of
  // the full-width labeled button used in a profile's own action row.
  compact?: boolean;
}) {
  const router = useRouter();
  const [isFriend, setIsFriend] = useState(initialIsFriend);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/${targetId}`, {
        method: isFriend ? "DELETE" : "POST",
      });
      if (res.ok) {
        setIsFriend((v) => !v);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-label={isFriend ? dict.publicProfile.friendAdded : dict.publicProfile.addFriend}
        className={`flex h-9 w-9 items-center justify-center rounded-xl border disabled:opacity-70 ${
          isFriend
            ? "border-border text-foreground"
            : "border-brand-via/40 bg-brand-via/10 text-brand-via"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFriend ? (
          <UserCheck className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={
        isFriend
          ? "flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-70"
          : "btn-brand flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
      }
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFriend ? (
        <UserCheck className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {isFriend ? dict.publicProfile.friendAdded : dict.publicProfile.addFriend}
    </button>
  );
}
