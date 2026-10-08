import type { Metadata } from "next";
import Link from "next/link";
import { Flag, Gift, List, Mail, MessageCircle, QrCode, ShieldOff, UserRoundSearch, Users, Wifi } from "lucide-react";
import { countBlockedUsers, countOnlineUsers, countUsers } from "@/lib/admin-users";
import { getTagStats } from "@/lib/tags";
import { countAllMessages } from "@/lib/messages";
import { getActiveAds, getAllAds } from "@/lib/ads";
import { countUnhandledAdInquiries } from "@/lib/ad-inquiries";
import { countGuestVisitors } from "@/lib/guest-visits";
import { getListingCountsByCountry, getListingStats } from "@/lib/listings";
import { getReportedListings } from "@/lib/listing-reports";
import { countryName } from "@/lib/country-names";
import StatCard from "@/components/StatCard";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Statistika — Findo",
};

export default async function AdminDashboardPage() {
  await requireAdmin();
  const totalUsers = countUsers();
  const onlineUsers = countOnlineUsers();
  const blockedUsers = countBlockedUsers();
  const tagStats = getTagStats();
  const totalMessages = countAllMessages();
  const activeAds = getActiveAds().length;
  const allAds = getAllAds().length;
  const listingStats = getListingStats();
  const reportedCount = getReportedListings().length;
  const unhandledInquiries = countUnhandledAdInquiries();
  const guestVisitors = countGuestVisitors();
  const listingsByCountry = getListingCountsByCountry();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Statistika</h1>
      <p className="mt-1.5 text-sm text-muted">
        Saytning umumiy holati bir qarashda — har bir kartaga bosib batafsil ma'lumotga o'ting.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Users} value={String(totalUsers)} label="Jami foydalanuvchi" href="/admin/foydalanuvchilar" />
        <StatCard
          icon={Wifi}
          value={String(onlineUsers)}
          label="Hozir onlayn"
          href="/admin/foydalanuvchilar?filter=online"
        />
        <StatCard
          icon={ShieldOff}
          value={String(blockedUsers)}
          label="Bloklangan"
          href="/admin/foydalanuvchilar?filter=blocked"
        />
        <StatCard
          icon={List}
          value={`${listingStats.active} / ${listingStats.total}`}
          label="Faol e'lonlar"
          href="/admin/elonlar"
        />
        <StatCard icon={Flag} value={String(reportedCount)} label="Shikoyat qilingan" href="/admin/shikoyatlar" />
        <StatCard
          icon={QrCode}
          value={`${tagStats.active} / ${tagStats.total}`}
          label="Faol QR-belgilar"
          href="/admin/qr-belgilar"
        />
        <StatCard icon={MessageCircle} value={String(totalMessages)} label="Jami xabarlar" href="/admin/xabarlar" />
        <StatCard icon={Gift} value={`${activeAds} / ${allAds}`} label="Faol reklamalar" href="/admin/reklama" />
        <StatCard
          icon={Mail}
          value={String(unhandledInquiries)}
          label="Yangi reklama arizalari"
          href="/admin/reklama-arizalari"
        />
        <StatCard
          icon={UserRoundSearch}
          value={String(guestVisitors)}
          label="Ro'yxatdan o'tmagan mehmonlar"
          href="/admin/mehmonlar"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-bold">Davlatlar bo'yicha e'lonlar</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5">Davlat</th>
                <th className="px-4 py-2.5">E'lonlar soni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {listingsByCountry.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-muted">
                    Hozircha e'lon yo'q.
                  </td>
                </tr>
              ) : (
                listingsByCountry.map((row) => (
                  <tr key={row.country}>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/elonlar?country=${row.country}`}
                        className="font-semibold hover:text-brand-via"
                      >
                        {countryName(row.country)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
