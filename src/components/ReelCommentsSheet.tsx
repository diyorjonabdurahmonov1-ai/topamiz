"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { ListingComment } from "@/lib/listing-comments";
import type { Dictionary } from "@/lib/i18n";
import CommentSection from "./CommentSection";

export default function ReelCommentsSheet({
  listingId,
  loggedIn,
  dict,
  onClose,
  onCommentPosted,
}: {
  listingId: string;
  loggedIn: boolean;
  dict: Dictionary;
  onClose: () => void;
  onCommentPosted: (count: number) => void;
}) {
  const [comments, setComments] = useState<ListingComment[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/listings/${listingId}/comments`)
      .then((res) => (res.ok ? res.json() : { comments: [] }))
      .then((data) => {
        if (!cancelled) setComments(data.comments);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        className="relative max-h-[75vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.common.close}
          className="absolute right-5 top-4 text-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {comments === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          </div>
        ) : (
          <CommentSection
            listingId={listingId}
            initialComments={comments}
            loggedIn={loggedIn}
            dict={dict}
            onCommentAdded={onCommentPosted}
          />
        )}
      </div>
    </div>
  );
}
