"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import ReelCommentsSheet from "./ReelCommentsSheet";

// A compact trigger + the same bottom-sheet used by Reels — comments live in
// one shared list either way, this just gives the listing page a small,
// out-of-the-way way to reach it instead of a big always-open section.
export default function ListingCommentButton({
  listingId,
  initialCount,
  loggedIn,
  dict,
}: {
  listingId: string;
  initialCount: number;
  loggedIn: boolean;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);

  function handleClick() {
    if (!loggedIn) {
      router.push("/kirish");
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <MessageCircle className="h-4 w-4" />
        {count}
      </button>

      {open && (
        <ReelCommentsSheet
          listingId={listingId}
          loggedIn={loggedIn}
          dict={dict}
          onClose={() => setOpen(false)}
          onCommentPosted={setCount}
        />
      )}
    </>
  );
}
