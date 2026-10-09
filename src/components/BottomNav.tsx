"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Home, MessageCircle, Plus, Search, User } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n";

export default function BottomNav({
  user,
  unreadCount = 0,
  dict,
}: {
  user: AuthUser | null;
  unreadCount?: number;
  dict: Dictionary;
}) {
  const pathname = usePathname();
  const typing = useTyping();

  const items = [
    { href: "/", icon: Home, label: dict.bottomNav.home },
    { href: "/elonlar", icon: Search, label: dict.bottomNav.listings },
    { href: "/reels", icon: Clapperboard, label: dict.social.reelsNavLabel },
    // "Post a listing" sits in the bar itself rather than floating over the
    // page, where it used to cover chat and comment inputs.
    { href: "/elon-qoshish", icon: Plus, label: dict.nav.postListing, primary: true },
    {
      href: user ? "/xabarlar" : "/kirish",
      icon: MessageCircle,
      label: dict.bottomNav.messages,
      badge: unreadCount,
    },
    {
      href: user ? "/profil" : "/kirish",
      icon: User,
      label: user ? dict.bottomNav.profile : dict.bottomNav.login,
    },
  ];

  return (
    <>
      <nav
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg-elevated/95 backdrop-blur-lg sm:hidden ${
          typing ? "hidden" : ""
        }`}
      >
        <div className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            if (item.primary) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="flex flex-1 flex-col items-center justify-center py-2"
                >
                  <span className="btn-brand flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg">
                    <item.icon className="h-6 w-6" strokeWidth={2.5} />
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium ${
                  active ? "text-brand-via" : "text-muted"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {!!item.badge && (
                  <span className="absolute right-5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

const NON_TEXT_INPUTS = new Set(["checkbox", "radio", "button", "submit", "reset", "range", "file", "color", "image"]);

function isTextEntry(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el.tagName === "TEXTAREA" || el.tagName === "SELECT") return true;
  return el instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(el.type);
}

// True while a text field has focus — i.e. while the phone keyboard is up.
// The bar then steps aside: pinned to the bottom of the shrunken screen, it
// would otherwise sit right on top of the field being typed into.
function useTyping(): boolean {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (isTextEntry(e.target as Element)) setTyping(true);
    };
    // Focus may be moving straight to another field; check where it landed.
    const onFocusOut = () => setTimeout(() => setTyping(isTextEntry(document.activeElement)), 0);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);
  return typing;
}
