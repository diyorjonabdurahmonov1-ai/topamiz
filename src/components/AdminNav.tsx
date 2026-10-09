"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Flag,
  LayoutDashboard,
  List,
  Mail,
  Megaphone,
  MessageCircle,
  QrCode,
  UserRoundSearch,
  Users,
} from "lucide-react";

const LINKS = [
  { href: "/admin", icon: LayoutDashboard, label: "Statistika" },
  { href: "/admin/foydalanuvchilar", icon: Users, label: "Foydalanuvchilar" },
  { href: "/admin/elonlar", icon: List, label: "Barcha e'lonlar" },
  { href: "/admin/shikoyatlar", icon: Flag, label: "Shikoyatlar" },
  { href: "/admin/qr-belgilar", icon: QrCode, label: "QR-belgilar" },
  { href: "/admin/xabarlar", icon: MessageCircle, label: "Xabarlar" },
  { href: "/admin/mehmonlar", icon: UserRoundSearch, label: "Mehmonlar" },
  { href: "/admin/reklama", icon: Megaphone, label: "Reklama" },
  { href: "/admin/reklama-arizalari", icon: Mail, label: "Reklama arizalari" },
  { href: "/admin/tahlil", icon: BarChart3, label: "Tahlil" },
];

// Scrolls sideways on a phone instead of wrapping into four rows. `badges`
// marks the sections with something waiting (new reports, ad inquiries).
export default function AdminNav({ badges }: { badges: Record<string, number> }) {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        const badge = badges[link.href] ?? 0;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
              active
                ? "border-brand-via/50 bg-brand-via/10 text-brand-via"
                : "border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
            {badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
