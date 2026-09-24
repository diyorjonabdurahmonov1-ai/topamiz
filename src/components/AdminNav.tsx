"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flag, LayoutDashboard, Mail, Megaphone, Users } from "lucide-react";

const LINKS = [
  { href: "/admin", icon: LayoutDashboard, label: "Statistika" },
  { href: "/admin/foydalanuvchilar", icon: Users, label: "Foydalanuvchilar" },
  { href: "/admin/shikoyatlar", icon: Flag, label: "Shikoyatlar" },
  { href: "/admin/reklama", icon: Megaphone, label: "Reklama" },
  { href: "/admin/reklama-arizalari", icon: Mail, label: "Reklama arizalari" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
              active
                ? "border-brand-via/50 bg-brand-via/10 text-brand-via"
                : "border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
