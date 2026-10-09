import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, List, MessageCircle, QrCode } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getFollowerCount, getFriendCount } from "@/lib/friends";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import ProfileEditForm from "@/components/ProfileEditForm";
import LogoutButton from "@/components/LogoutButton";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import FriendCounts from "@/components/FriendCounts";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import UserSearch from "@/components/UserSearch";

export const metadata: Metadata = {
  title: "Mening profilim — Findo",
};

export default async function OwnProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const friendCount = getFriendCount(user.id);
  const followerCount = getFollowerCount(user.id);

  const links = [
    { href: "/xabarlar", icon: MessageCircle, label: dict.profile.myMessages },
    { href: "/mening-elonlarim", icon: List, label: dict.profile.myListings },
    { href: "/mening-belgilarim", icon: QrCode, label: dict.profile.myQrTags },
    ...(isAdmin(user) ? [{ href: "/admin", icon: LayoutDashboard, label: dict.profile.adminPanel }] : []),
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <ProfileEditForm user={user} dict={dict} />
        <FriendCounts
          userId={user.id}
          friendCount={friendCount}
          followerCount={followerCount}
          locale={locale}
          className="mt-4"
        />
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {dict.profile.findPeopleHeading}
        </h2>
        <UserSearch dict={dict} mode="profile" />
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
        <PushNotificationToggle dict={dict} />
      </div>

      <div className="mt-4 flex justify-center">
        <LogoutButton label={dict.profile.logout} />
      </div>

      <div className="mt-6 flex justify-center">
        <DeleteAccountButton
          label={dict.profile.deleteAccount}
          confirmText={dict.profile.deleteAccountConfirm}
          errorText={dict.profile.deleteAccountError}
        />
      </div>
    </div>
  );
}
