"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import type { MessageRow } from "@/lib/messages";

export default function ChatThread({
  otherUserId,
  currentUserId,
  initialMessages,
}: {
  otherUserId: number;
  currentUserId: number;
  initialMessages: MessageRow[];
}) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/messages/${otherUserId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [otherUserId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    const res = await fetch(`/api/messages/${otherUserId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div ref={scrollRef} className="max-h-[520px] min-h-[360px] space-y-2.5 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            Hali xabar yo'q. Birinchi xabarni yozing.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? "rounded-tr-sm btn-brand text-white"
                      : "rounded-tl-sm bg-surface-2 text-foreground"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Xabar yozing..."
          className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
        />
        <button
          type="submit"
          disabled={sending}
          className="btn-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-60"
          aria-label="Yuborish"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
