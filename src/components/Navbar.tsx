"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Plus, MessageCircle, QrCode } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";

const links = [
  { href: "/elonlar", label: "E'lonlar" },
  { href: "/mukofotli", label: "Mukofotli" },
  { href: "/ai-yordamchi", label: "AI Yordamchi" },
  { href: "/reklama", label: "Reklama" },
];

export default function Navbar({
  user,
  unreadCount = 0,
}: {
  user: AuthUser | null;
  unreadCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-foreground bg-surface-2"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {user && (
            <Link
              href="/xabarlar"
              aria-label="Xabarlar"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <Link href="/profil" className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-surface-2">
              <Avatar name={user.name} color={user.avatarColor} size={30} />
              <span className="max-w-24 truncate text-sm font-semibold">{user.name}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/kirish"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
              >
                Kirish
              </Link>
              <Link
                href="/royxatdan-otish"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
              >
                Ro'yxatdan o'tish
              </Link>
            </div>
          )}
          <Link
            href="/elon-qoshish"
            className="btn-brand flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            E'lon joylash
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menyu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/belgilash"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
            >
              <QrCode className="h-4 w-4" />
              QR-belgi yaratish
            </Link>
            {!user && (
              <Link
                href="/kirish"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
              >
                Kirish / Ro'yxatdan o'tish
              </Link>
            )}
            <Link
              href="/elon-qoshish"
              onClick={() => setOpen(false)}
              className="btn-brand mt-2 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              E'lon joylash
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
