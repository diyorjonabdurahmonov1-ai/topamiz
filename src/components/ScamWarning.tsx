import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

// The one thing that stops most scams: a buyer who doesn't send money before
// seeing the goods. Findo never handles payment, so every fraud runs through
// a chat or a phone call — these sit where that conversation starts.

// Under the contact button on a listing: a short lead, one sentence, and the
// way into the full safety rules.
export function ScamWarningCard({ dict }: { dict: Dictionary }) {
  return (
    <div className="mt-3 flex gap-2.5 rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-3 py-2.5">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent-gold" aria-hidden="true" />
      <p className="text-xs leading-snug text-foreground/80">
        <span className="font-semibold text-foreground">{dict.safety.scamTitle}</span> {dict.safety.scamBody}{" "}
        <Link
          href="/xavfsizlik-qoidalari"
          className="whitespace-nowrap font-semibold text-foreground underline decoration-accent-gold decoration-2 underline-offset-2 hover:decoration-foreground"
        >
          {dict.footer.safetyRules} →
        </Link>
      </p>
    </div>
  );
}

// Pinned above a chat's messages (outside the scrolling part), so it is
// always in view without taking a line from the conversation.
export function ScamWarningStrip({ dict }: { dict: Dictionary }) {
  return (
    <div className="flex items-center gap-2 border-b border-accent-gold/20 bg-accent-gold/10 px-4 py-2">
      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-accent-gold" aria-hidden="true" />
      <p className="text-xs leading-snug text-foreground/80">{dict.safety.scamChat}</p>
    </div>
  );
}
