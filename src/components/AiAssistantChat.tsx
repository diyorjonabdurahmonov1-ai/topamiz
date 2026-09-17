"use client";

import { useRef, useState, type FormEvent } from "react";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { listings } from "@/lib/data";
import { smartSearch } from "@/lib/ai";
import type { Listing } from "@/lib/types";
import ListingCard from "./ListingCard";

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
  results?: Listing[];
}

const suggestions = [
  "Toshkentda yo'qolgan qora hamyon",
  "Ko'k rangli iPhone topildi",
  "Samarqandda yo'qolgan mushuk",
  "Hujjatlarim yo'qolgan",
];

export default function AiAssistantChat() {
  const idCounter = useRef(0);
  function nextId() {
    idCounter.current += 1;
    return `m-${idCounter.current}`;
  }

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-0",
      role: "assistant",
      text: "Assalomu alaykum! Men Topamiz AI yordamchisiman. Yo'qotgan yoki topgan buyumingiz haqida qisqacha yozing — men mos e'lonlarni qidirib topaman.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function respond(query: string) {
    const active = listings.filter((l) => l.status === "active");
    const results = smartSearch(query, active).slice(0, 4);
    const text =
      results.length > 0
        ? `"${query}" bo'yicha ${results.length} ta mos e'lon topdim. Eng mosini quyida ko'rishingiz mumkin:`
        : `"${query}" bo'yicha hozircha mos e'lon topa olmadim. Iltimos, boshqa so'zlar bilan tavsiflab ko'ring yoki o'zingiz e'lon joylang.`;

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "assistant", text, results: results.length ? results : undefined },
    ]);
    setThinking(false);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function send(query: string) {
    const trimmed = query.trim();
    if (!trimmed || thinking) return;
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: trimmed }]);
    setInput("");
    setThinking(true);
    setTimeout(() => respond(trimmed), 550);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl btn-brand text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold">Topamiz AI Yordamchi</p>
          <p className="flex items-center gap-1 text-xs text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Onlayn
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-[520px] min-h-[320px] space-y-4 overflow-y-auto p-4 sm:p-5">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                m.role === "assistant" ? "btn-brand text-white" : "bg-surface-2 text-muted"
              }`}
            >
              {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={`max-w-[85%] ${m.role === "user" ? "items-end" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "assistant"
                    ? "rounded-tl-sm bg-surface-2 text-foreground"
                    : "rounded-tr-sm btn-brand text-white"
                }`}
              >
                {m.text}
              </div>
              {m.results && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {m.results.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full btn-brand text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="flex items-center gap-1 rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              <Sparkles className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buyumingizni tavsiflab yozing..."
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
          />
          <button
            type="submit"
            disabled={thinking}
            className="btn-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-60"
            aria-label="Yuborish"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
