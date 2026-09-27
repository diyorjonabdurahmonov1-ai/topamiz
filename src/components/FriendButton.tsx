"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export default function FriendButton({
  targetId,
  initialIsFriend,
  dict,
}: {
  targetId: number;
  initialIsFriend: boolean;
  dict: Dictionary;
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
