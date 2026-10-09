import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Flag,
  Gift,
  HeartHandshake,
  List,
  Mail,
  MessageCircle,
  QrCode,
  ShieldOff,
  UserRoundSearch,
  Users,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { getActivity, getDailyActivity, type DailyPoint } from "@/lib/admin-stats";
import { countRecentErrorGroups } from "@/lib/error-log";

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
  const activity = getActivity();
  const daily = getDailyActivity();
  const recentErrors = countRecentErrorGroups();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Statistika</h1>
      <p className="mt-1.5 text-sm text-muted">
        Saytning umumiy holati bir qarashda — har bir kartaga bosib batafsil ma'lumotga o'ting.
      </p>

      <div className="mt-5 space-y-2">
        {reportedCount > 0 && (
          <AttentionLink href="/admin/shikoyatlar" tone="danger" icon={AlertTriangle}>
            {reportedCount} ta e&apos;lon ustidan shikoyat bor — ko&apos;rib chiqing
          </AttentionLink>
        )}
        {unhandledInquiries > 0 && (
          <AttentionLink href="/admin/reklama-arizalari" tone="gold" icon={Mail}>
            {unhandledInquiries} ta yangi reklama arizasi javob kutmoqda
          </AttentionLink>
        )}
        {recentErrors > 0 && (
          <AttentionLink href="/admin/xatolar" tone="gold" icon={Bug}>
            So&apos;nggi 24 soatda {recentErrors} xil xato chiqdi — ko&apos;rib chiqing
          </AttentionLink>
        )}
        {reportedCount === 0 && unhandledInquiries === 0 && recentErrors === 0 && (
          <p className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            Hammasi joyida — ko&apos;rib chiqilmagan shikoyat, ariza yoki yangi xato yo&apos;q.
          </p>
        )}
      </div>

      <h2 className="mt-7 text-sm font-bold">Faollik</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ActivityCard icon={Users} label="Yangi foydalanuvchilar" today={activity.users.today} week={activity.users.week} />
        <ActivityCard icon={List} label="Yangi e'lonlar" today={activity.listings.today} week={activity.listings.week} />
        <ActivityCard icon={MessageCircle} label="Xabarlar" today={activity.messages.today} week={activity.messages.week} />
        <div className="rounded-2xl border border-success/30 bg-success/5 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <HeartHandshake className="h-4 w-4" />
            Egasiga qaytarildi
          </p>
          <p className="mt-2 text-2xl font-extrabold">{activity.resolved}</p>
          <p className="text-xs text-muted">jami topilgan buyumlar</p>
        </div>
      </div>

      <DailyChart points={daily} />

      <h2 className="mt-8 text-sm font-bold">Umumiy holat</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
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

function AttentionLink({
  href,
  tone,
  icon: Icon,
  children,
}: {
  href: string;
  tone: "danger" | "gold";
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
        tone === "danger"
          ? "border-danger/30 bg-danger/10 text-danger hover:bg-danger/15"
          : "border-accent-gold/30 bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/15"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{children}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}

function ActivityCard({ icon: Icon, label, today, week }: { icon: LucideIcon; label: string; today: number; week: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Icon className="h-4 w-4 text-brand-via" />
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold">
        {today}
        <span className="ml-1 text-xs font-semibold text-muted">bugun</span>
      </p>
      <p className="text-xs text-muted">{week} ta — so&apos;nggi 7 kunda</p>
    </div>
  );
}

const WEEKDAYS = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

// New listings and users per day, as plain CSS bars — no chart library.
function DailyChart({ points }: { points: DailyPoint[] }) {
  const max = Math.max(1, ...points.flatMap((p) => [p.listings, p.users]));
  return (
    <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted">So&apos;nggi 7 kun</p>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-brand-via" />
            E&apos;lonlar
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-brand-to" />
            Foydalanuvchilar
          </span>
        </div>
      </div>
      <div className="mt-3 grid h-36 grid-cols-7 items-end gap-2">
        {points.map((p) => (
          <div key={p.day} className="flex h-full flex-col items-center justify-end gap-1">
            <div className="flex h-full w-full items-end justify-center gap-0.5">
              {(
                [
                  [p.listings, "bg-brand-via"],
                  [p.users, "bg-brand-to"],
                ] as const
              ).map(([value, color], i) => (
                <div key={i} className="flex h-full w-1/2 max-w-4 flex-col items-center justify-end">
                  {value > 0 && <span className="mb-0.5 text-[9px] font-bold text-muted">{value}</span>}
                  <div
                    className={`w-full rounded-t ${color} ${value === 0 ? "opacity-20" : ""}`}
                    style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-semibold text-muted">
              {WEEKDAYS[new Date(`${p.day}T00:00:00Z`).getUTCDay()]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
