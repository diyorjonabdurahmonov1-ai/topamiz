import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Megaphone, QrCode } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import ProfileEditForm from "@/components/ProfileEditForm";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Mening profilim — Topamiz",
};

export default async function OwnProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");

  const links = [
    { href: "/xabarlar", icon: MessageCircle, label: "Xabarlarim" },
    { href: "/mening-belgilarim", icon: QrCode, label: "QR-belgilarim" },
    ...(isAdmin(user)
      ? [{ href: "/admin/reklama", icon: Megaphone, label: "Reklama boshqaruvi" }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <ProfileEditForm user={user} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card-hover flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-4 text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-brand-via">
              <link.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-muted">{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <LogoutButton />
      </div>
    </div>
  );
}
