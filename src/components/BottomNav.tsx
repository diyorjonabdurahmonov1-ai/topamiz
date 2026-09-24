"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Home, MessageCircle, QrCode, Search, User } from "lucide-react";
import type { AuthUser } from "@/lib/auth";

export default function BottomNav({
  user,
  unreadCount = 0,
}: {
  user: AuthUser | null;
  unreadCount?: number;
}) {
  const pathname = usePathname();

  const items = [
    { href: "/", icon: Home, label: "Bosh sahifa" },
    { href: "/elonlar", icon: Search, label: "E'lonlar" },
    { href: "/ai-yordamchi", icon: Bot, label: "AI" },
    { href: "/belgilash", icon: QrCode, label: "Belgilash", primary: true },
    {
      href: user ? "/xabarlar" : "/kirish",
      icon: MessageCircle,
      label: "Xabarlar",
      badge: unreadCount,
    },
    { href: user ? "/profil" : "/kirish", icon: User, label: user ? "Profil" : "Kirish" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg-elevated/95 backdrop-blur-lg sm:hidden">
      <div className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          if (item.primary) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center py-2"
              >
                <span className="btn-brand flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg">
                  <item.icon className="h-5 w-5" />
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
  );
}
