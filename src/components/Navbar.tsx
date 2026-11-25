"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Plus, MessageCircle, Bell, User } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import type { Dictionary, Locale } from "@/lib/i18n";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar({
  user,
  unreadCount = 0,
  notificationCount = 0,
  locale,
  dict,
}: {
  user: AuthUser | null;
  unreadCount?: number;
  notificationCount?: number;
  locale: Locale;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Going to another page closes the menu.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  // The menu is a panel hanging under the bar, not part of the page: scrolling
  // the page, pressing Escape or tapping outside puts it away again.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const bell = user && (
    <Link
      href="/bildirishnomalar"
      aria-label={dict.notifications.navLabel}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground"
    >
      <Bell className="h-4 w-4" />
      {notificationCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>
      )}
    </Link>
  );

  const links = [
    { href: "/elonlar", label: dict.nav.listings },
    { href: "/reels", label: dict.social.reelsNavLabel },
    { href: "/mukofotli", label: dict.nav.rewarded },
    { href: "/sirli-quti", label: dict.nav.mysteryBox },
    { href: "/reklama", label: dict.nav.ads },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass pt-[env(safe-area-inset-top)]">
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
          <LanguageSwitcher locale={locale} label={dict.languageSwitcher.label} />
          <ThemeToggle label={dict.common.themeToggle} />
          {bell}
          {user && (
            <Link
              href="/xabarlar"
              aria-label={dict.nav.messages}
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
              <Avatar name={user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} size={30} />
              <span className="max-w-24 truncate text-sm font-semibold">{user.name}</span>
            </Link>
          ) : (
            <Link
              href="/kirish"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
            >
              {dict.nav.login}
            </Link>
          )}
          <Link
            href="/elon-qoshish"
            className="btn-brand flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            {dict.nav.postListing}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher locale={locale} label={dict.languageSwitcher.label} />
          {bell}
          {/* The profile lives up here (not in the bottom bar): the picture
              for someone signed in, a person icon that leads to sign-in
              for a guest. */}
          <Link
            href={user ? "/profil" : "/kirish"}
            aria-label={user ? dict.bottomNav.profile : dict.nav.login}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-muted hover:text-foreground"
          >
            {user ? (
              <Avatar name={user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} size={34} />
            ) : (
              <User className="h-4 w-4" />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={dict.nav.menu}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden">
          {/* Tapping the dimmed page puts the menu away. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-x-0 top-full h-dvh cursor-default bg-black/40"
          />
          <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain border-b border-border bg-bg-elevated px-4 pb-4 pt-2 shadow-xl">
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
              <div className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium text-muted">
                <span>{dict.common.themeToggle}</span>
                <ThemeToggle label={dict.common.themeToggle} />
              </div>
              <Link
                href="/elon-qoshish"
                onClick={() => setOpen(false)}
                className="btn-brand mt-2 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                {dict.nav.postListing}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
