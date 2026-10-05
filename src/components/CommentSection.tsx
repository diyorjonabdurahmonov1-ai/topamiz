"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import type { ListingComment } from "@/lib/listing-comments";
import type { Dictionary } from "@/lib/i18n";
import Avatar from "./Avatar";

export default function CommentSection({
  listingId,
  initialComments,
  loggedIn,
  dict,
  onCommentAdded,
}: {
  listingId: string;
  initialComments: ListingComment[];
  loggedIn: boolean;
  dict: Dictionary;
  onCommentAdded?: (count: number) => void;
}) {
  const router = useRouter();
  // initialComments is only ever this component's starting point — a caller
  // that reuses CommentSection for a different listing mounts a fresh
  // instance (key={listingId}) rather than this component re-syncing its own
  // state from a changed prop.
  const [comments, setComments] = useState(initialComments);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!loggedIn) {
      router.push("/kirish");
      return;
    }
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/${listingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? dict.social.commentGenericError);
      setComments((prev) => {
        const next = [...prev, data.comment];
        onCommentAdded?.(next.length);
        return next;
      });
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.social.commentGenericError);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-bold">
        {dict.social.commentsHeading} {comments.length > 0 && `(${comments.length})`}
      </h2>

      <div className="mt-3 space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-muted">{dict.social.commentsEmpty}</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar name={c.userName} color={c.userAvatarColor} avatarUrl={c.userAvatarUrl} size={32} />
              <div className="min-w-0 flex-1 rounded-2xl bg-surface-2 px-3.5 py-2">
                <p className="text-xs font-semibold">{c.userName}</p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-foreground">{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={loggedIn ? dict.social.commentPlaceholder : dict.social.commentLoginPrompt}
          className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
        />
        <button
          type="submit"
          disabled={sending}
          aria-label={dict.social.commentSend}
          className="btn-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-60"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
