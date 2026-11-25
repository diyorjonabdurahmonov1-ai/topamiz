"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signupHrefHere } from "@/lib/safe-next";
import { Loader2, Send, X } from "lucide-react";
import type { ListingComment } from "@/lib/listing-comments";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatTimeAgo } from "@/lib/i18n/format";
import Avatar from "./Avatar";
import { failureMessage } from "@/lib/fetch-error";

export default function CommentSection({
  listingId,
  initialComments,
  loggedIn,
  dict,
  locale,
  onCommentAdded,
}: {
  listingId: string;
  initialComments: ListingComment[];
  loggedIn: boolean;
  dict: Dictionary;
  locale: Locale;
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
  // Who the next message answers (null: a new comment), and which comments'
  // replies are unfolded.
  const [replyTo, setReplyTo] = useState<ListingComment | null>(null);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const topLevel = comments.filter((c) => c.parentId === null);
  const repliesOf = new Map<number, ListingComment[]>();
  for (const c of comments) {
    if (c.parentId === null) continue;
    repliesOf.set(c.parentId, [...(repliesOf.get(c.parentId) ?? []), c]);
  }

  function startReply(c: ListingComment) {
    if (!loggedIn) {
      router.push(signupHrefHere());
      return;
    }
    setReplyTo(c);
    setError("");
    inputRef.current?.focus();
  }

  function toggleReplies(id: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!loggedIn) {
      router.push(signupHrefHere());
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
        body: JSON.stringify({ body: text, replyTo: replyTo?.id ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? dict.social.commentGenericError);
      const added: ListingComment = data.comment;
      setComments((prev) => {
        const next = [...prev, added];
        onCommentAdded?.(next.length);
        return next;
      });
      // Show the reply that was just written.
      if (added.parentId !== null) setOpen((prev) => new Set(prev).add(added.parentId as number));
      setInput("");
      setReplyTo(null);
    } catch (err) {
      setError(failureMessage(err, dict.common.networkError, dict.social.commentGenericError));
    } finally {
      setSending(false);
    }
  }

  function renderComment(c: ListingComment, isReply: boolean) {
    return (
      <div key={c.id} className="flex items-start gap-2.5">
        <Avatar name={c.userName} color={c.userAvatarColor} avatarUrl={c.userAvatarUrl} size={isReply ? 26 : 34} />
        <div className="min-w-0 flex-1">
          {/* The author and the time on one line, the text under it, so a
              name is never read as the first word of the comment. */}
          <div className="flex items-baseline gap-2">
            <span className="truncate text-[13px] font-bold text-foreground">{c.userName}</span>
            <span className="shrink-0 text-xs text-muted">{formatTimeAgo(locale, c.createdAt)}</span>
          </div>
          <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-snug text-foreground/85">
            {c.replyToName && isReply && <span className="font-semibold text-brand-via">@{c.replyToName} </span>}
            {c.body}
          </p>
          <button
            type="button"
            onClick={() => startReply(c)}
            className="mt-1 text-xs font-semibold text-muted hover:text-foreground"
          >
            {dict.social.commentReply}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-bold">
        {dict.social.commentsHeading} {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* A fixed-height, independently scrolling list — once a listing has a
          lot of comments this keeps the card (and, inside the Reels sheet,
          the video behind it) from being pushed off-screen by an
          ever-growing column of bubbles. */}
      <div className="mt-3 max-h-72 space-y-4 overflow-y-auto pr-1">
        {topLevel.length === 0 ? (
          <p className="text-sm text-muted">{dict.social.commentsEmpty}</p>
        ) : (
          topLevel.map((c) => {
            const replies = repliesOf.get(c.id) ?? [];
            const unfolded = open.has(c.id);
            return (
              <div key={c.id}>
                {renderComment(c, false)}
                {replies.length > 0 && (
                  <div className="ml-11 mt-2">
                    <button
                      type="button"
                      onClick={() => toggleReplies(c.id)}
                      className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground"
                    >
                      <span className="h-px w-6 bg-border" />
                      {unfolded
                        ? dict.social.commentHideReplies
                        : dict.social.commentViewReplies.replace("{n}", String(replies.length))}
                    </button>
                    {unfolded && <div className="mt-3 space-y-3">{replies.map((r) => renderComment(r, true))}</div>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {replyTo && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted">
          <span className="truncate">{dict.social.commentReplyingTo.replace("{name}", replyTo.userName)}</span>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            aria-label={dict.social.commentReplyCancel}
            className="shrink-0 text-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`${replyTo ? "mt-2" : "mt-4"} flex items-center gap-2`}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            !loggedIn
              ? dict.social.commentLoginPrompt
              : replyTo
                ? dict.social.commentReplyPlaceholder
                : dict.social.commentPlaceholder
          }
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
